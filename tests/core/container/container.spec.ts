import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { BindingScope } from "../../../src/interfaces/binding";
import { Injectable } from "../../../src/decorators/injectable";
import { Inject } from "../../../src/decorators/inject";
import { InjectionToken } from "../../../src/interfaces/token";

// Test service classes
@Injectable()
class TestService {
  public getValue(): string {
    return "test-service";
  }
}

@Injectable()
class DependentService {
  constructor(private testService: TestService) {}

  public getValue(): string {
    return `dependent-service: ${this.testService.getValue()}`;
  }
}

// Token for testing
const TEST_TOKEN = new InjectionToken<any>("TestToken");

describe("DIContainer", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  describe("Binding Operations", () => {
    it("should bind a token to a class", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      expect(container.isBound(TestService)).toBeTruthy();
    });

    it("should unbind a token", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();
      expect(container.isBound(TestService)).toBeTruthy();

      container.unbind(TestService);

      expect(container.isBound(TestService)).toBeFalsy();
    });

    it("should rebind a token", () => {
      
      container.bind(TEST_TOKEN).toValue("original value");
      expect(container.resolve(TEST_TOKEN)).toBe("original value");

      container.rebind(TEST_TOKEN).toValue("new value");

      expect(container.resolve(TEST_TOKEN)).toBe("new value");
    });
  });

  describe("Resolution", () => {
    it("should resolve a class binding", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      const instance = container.resolve(TestService);

      expect(instance).toBeInstanceOf(TestService);
      expect(instance.getValue()).toBe("test-service");
    });

    it("should resolve transient bindings to different instances", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();

      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      expect(instance1).not.toBe(instance2);
    });

    it("should resolve singleton bindings to the same instance", () => {
      
      container.bind(TestService).toClass(TestService).inSingletonScope();

      const instance1 = container.resolve(TestService);
      const instance2 = container.resolve(TestService);

      expect(instance1).toBe(instance2);
    });

    it("should resolve value bindings", () => {
      
      const testValue = { name: "test" };
      container.bind(TEST_TOKEN).toValue(testValue);

      const resolvedValue = container.resolve(TEST_TOKEN);

      expect(resolvedValue).toBe(testValue);
    });

    it("should resolve factory bindings", () => {
      
      const factory = () => ({ id: Math.random() });
      container.bind(TEST_TOKEN).toFactory(factory).inTransientScope();

      const instance = container.resolve(TEST_TOKEN);

      expect(instance).toHaveProperty("id");
    });

    it("should throw error when resolving unbound token", () => {
      expect(() => container.resolve(TEST_TOKEN)).toThrow(
        "No binding found for token"
      );
    });

    it("should return undefined for tryResolve with unbound token", () => {
      
      const result = container.tryResolve(TEST_TOKEN);

      expect(result).toBeUndefined();
    });

    it("should resolve async factory bindings", async () => {
      
      const asyncFactory = async () => ({ id: "async" });
      container.bind(TEST_TOKEN).toFactory(asyncFactory).inTransientScope();

      const result = await container.resolveAsync(TEST_TOKEN);

      expect(result).toHaveProperty("id", "async");
    });

    it("should resolve dependencies automatically", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();
      container
        .bind(DependentService)
        .toClass(DependentService)
        .inTransientScope();

      const instance = container.resolve(DependentService);

      expect(instance).toBeInstanceOf(DependentService);
      expect(instance.getValue()).toBe("dependent-service: test-service");
    });
  });

  describe("Child Containers", () => {
    it("should create a child container", () => {
      
      const childContainer = container.createChildContainer();

      expect(childContainer.getParent()).toBe(container);
    });

    it("should resolve from parent if not bound in child", () => {
      
      container.bind(TestService).toClass(TestService).inTransientScope();
      const childContainer = container.createChildContainer();

      const instance = childContainer.resolve(TestService);

      expect(instance).toBeInstanceOf(TestService);
    });

    it("should override parent bindings in child container", () => {
      
      class ParentService extends TestService {
        public getValue(): string {
          return "parent-service";
        }
      }

      class ChildService extends TestService {
        public getValue(): string {
          return "child-service";
        }
      }

      // Bind in parent
      container.bind(TestService).toClass(ParentService).inTransientScope();
      const childContainer = container.createChildContainer();

      // Override in child
      childContainer.bind(TestService).toClass(ChildService).inTransientScope();

      const parentInstance = container.resolve(TestService);
      const childInstance = childContainer.resolve(TestService);

      expect(parentInstance.getValue()).toBe("parent-service");
      expect(childInstance.getValue()).toBe("child-service");
    });
  });
});
