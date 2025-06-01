import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectionToken } from "../../../src/interfaces/token";
import { DependencyResolver } from "../../../src/core/resolution/resolver";
import { BindingManager } from "../../../src/core/binding/binding-manager";
import { BindingScope, BindingType } from "../../../src/interfaces/binding";

// Define test tokens and classes
const CLASS_TOKEN = new InjectionToken<any>("ClassToken");
const FACTORY_TOKEN = new InjectionToken<any>("FactoryToken");
const ERROR_TOKEN = new InjectionToken<any>("ErrorToken");

@Injectable()
class TestService {
  getValue(): string {
    return "test-service";
  }
}

describe("DependencyResolver Advanced Tests", () => {
  let container: Container;
  let resolver: DependencyResolver;
  let bindingManager: BindingManager;

  beforeEach(() => {
    container = new DIContainer();
    bindingManager = (container as any).bindingManager;
    resolver = new DependencyResolver(container, bindingManager);
  });

  describe("Binding Type Errors", () => {
    it("should throw error when class binding has no implementation", () => {
      const binding = {
        token: CLASS_TOKEN,
        type: BindingType.Class,
        scope: BindingScope.Transient,
        // Missing implementation
      };

      // Add binding directly to binding manager
      bindingManager.registerBinding(binding);
      expect(() => resolver.resolve(CLASS_TOKEN)).toThrow(
        /has no implementation class/
      );
    });

    it("should throw error when factory binding has no factory", () => {
      const binding = {
        token: FACTORY_TOKEN,
        type: BindingType.Factory,
        scope: BindingScope.Transient,
        // Missing factory
      };

      // Add binding directly to binding manager
      bindingManager.registerBinding(binding);
      expect(() => resolver.resolve(FACTORY_TOKEN)).toThrow(
        /has no factory function/
      );
    });

    it("should throw error for unknown binding type", () => {
      const binding = {
        token: ERROR_TOKEN,
        type: 999 as unknown as BindingType, // Invalid binding type
        scope: BindingScope.Transient,
      };

      // Add binding directly to binding manager
      bindingManager.registerBinding(binding);
      expect(() => resolver.resolve(ERROR_TOKEN)).toThrow(
        /Unknown binding type/
      );
    });
  });

  describe("Async Error Handling", () => {
    it("should throw descriptive error for missing bindings in resolveAsync", async () => {
      await expect(resolver.resolveAsync(ERROR_TOKEN)).rejects.toThrow(
        /No binding found for token/
      );
    });

    it("should throw error when class binding has no implementation in async resolution", async () => {
      const binding = {
        token: CLASS_TOKEN,
        type: BindingType.Class,
        scope: BindingScope.Transient,
        // Missing implementation
      };

      // Add binding directly to binding manager
      bindingManager.registerBinding(binding);
      await expect(resolver.resolveAsync(CLASS_TOKEN)).rejects.toThrow(
        /has no implementation class/
      );
    });

    it("should throw error when factory binding has no factory in async resolution", async () => {
      const binding = {
        token: FACTORY_TOKEN,
        type: BindingType.Factory,
        scope: BindingScope.Transient,
        // Missing factory
      };

      // Add binding directly to binding manager
      bindingManager.registerBinding(binding);
      await expect(resolver.resolveAsync(FACTORY_TOKEN)).rejects.toThrow(
        /has no factory function/
      );
    });
  });
});
