import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectionToken } from "../../../src/interfaces/token";
import { DependencyResolver } from "../../../src/core/resolution/resolver";
import { BindingScope } from "../../../src/interfaces/binding";
import { BindingManager } from "../../../src/core/binding/binding-manager";

// Define test tokens and classes
const TEST_TOKEN = new InjectionToken<string>("TestToken");
const FACTORY_TOKEN = new InjectionToken<any>("FactoryToken");
const ASYNC_TOKEN = new InjectionToken<any>("AsyncToken");

@Injectable()
class TestService {
  getValue(): string {
    return "test-service";
  }
}

@Injectable()
class DependentService {
  constructor(private service: TestService) {}

  getValue(): string {
    return `dependent: ${this.service.getValue()}`;
  }
}

describe("DependencyResolver", () => {
  let container: Container;
  let resolver: DependencyResolver;
  let bindingManager: BindingManager;

  beforeEach(() => {
    container = new DIContainer();
    // Get the internal binding manager from the container
    bindingManager = (container as any).bindingManager;
    // Create resolver with container and binding manager
    resolver = new DependencyResolver(container, bindingManager);
  });

  describe("resolve", () => {
    it("should resolve class bindings", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      const instance = resolver.resolve(TestService);

      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe("test-service");
    });

    it("should resolve value bindings", () => {
      
      const value = "test-value";
      container.bind(TEST_TOKEN).toValue(value);

      const result = resolver.resolve(TEST_TOKEN);

      expect(result).toBe(value);
    });

    it("should resolve factory bindings", () => {
      
      const factory = () => ({ id: "123", name: "test" });
      container.bind(FACTORY_TOKEN).toFactory(factory).inTransientScope();

      const result = resolver.resolve(FACTORY_TOKEN);

      expect(result.id).toBe("123");
      expect(result.name).toBe("test");
    });

    it("should resolve factory bindings with container access", () => {
      
      container.bind(TEST_TOKEN).toValue("test-value");
      container
        .bind(FACTORY_TOKEN)
        .toFactory((c) => {
          const value = c.resolve(TEST_TOKEN);
          return { generatedValue: `factory-${value}` };
        })
        .inTransientScope();

      const result = resolver.resolve(FACTORY_TOKEN);

      expect(result.generatedValue).toBe("factory-test-value");
    });

    it("should cache singleton instances", () => {
      
      container.bind(TestService).toClass(TestService).inSingletonScope();

      const instance1 = resolver.resolve(TestService);
      const instance2 = resolver.resolve(TestService);

      expect(instance1).toBe(instance2);
    });

    it("should not cache transient instances", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      const instance1 = resolver.resolve(TestService);
      const instance2 = resolver.resolve(TestService);

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("resolveAsync", () => {
    it("should resolve async factory bindings", async () => {
      
      const asyncFactory = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true };
      };
      container.bind(ASYNC_TOKEN).toFactory(asyncFactory).inTransientScope();

      const result = await resolver.resolveAsync(ASYNC_TOKEN);

      expect(result.async).toBe(true);
    });

    it("should resolve regular bindings asynchronously", async () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      const result = await resolver.resolveAsync(TestService);

      expect(result).toBeInstanceOf(TestService);
      expect(result.getValue()).toBe("test-service");
    });
  });

  describe("tryResolve", () => {
    it("should return undefined for unbound tokens", () => {
      
      const result = resolver.tryResolve(TEST_TOKEN);

      expect(result).toBeUndefined();
    });

    it("should resolve bound tokens", () => {
      
      container.bind(TEST_TOKEN).toValue("test-value");

      const result = resolver.tryResolve(TEST_TOKEN);

      expect(result).toBe("test-value");
    });
  });

  describe("Error handling", () => {
    it("should throw descriptive error for missing bindings", () => {
      expect(() => resolver.resolve(TEST_TOKEN)).toThrow(
        /No binding found for token/
      );
    });

    it("should throw descriptive error when factory returns promise but used synchronously", () => {
      
      const asyncFactory = () => Promise.resolve("async-value");
      container.bind(TEST_TOKEN).toFactory(asyncFactory).inTransientScope();
      expect(() => resolver.resolve(TEST_TOKEN)).toThrow(/returned a Promise/);
    });
  });
});
