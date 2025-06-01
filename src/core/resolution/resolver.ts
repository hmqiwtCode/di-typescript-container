import { Token } from "../../interfaces/token";
import { Binding, BindingScope, BindingType } from "../../interfaces/binding";
import { Container } from "../../interfaces/container";
import { BindingManager } from "../binding/binding-manager";
import { CircularDependencyHandler } from "./circular-dependency-handler";
import { InstanceCreator } from "./instance-creator";

/**
 * Core resolution logic for resolving dependencies
 */
export class DependencyResolver {
  private circularDependencyHandler = new CircularDependencyHandler();
  private instanceCreator: InstanceCreator;

  constructor(
    private container: Container,
    private bindingManager: BindingManager
  ) {
    this.instanceCreator = new InstanceCreator(container);
  }

  /**
   * Resolve an instance for a token
   */
  resolve<T>(token: Token<T>): T {
    this.circularDependencyHandler.checkCycle(token);
    const binding = this.bindingManager.getBinding(token);

    if (binding) {
      this.circularDependencyHandler.enterResolution(token);

      try {
        const result = this.resolveBinding<T>(binding);
        this.circularDependencyHandler.exitResolution(token);
        return result;
      } catch (error) {
        this.circularDependencyHandler.exitResolution(token);
        throw error;
      }
    }

    // If not found and we have a parent, try to resolve from parent
    if (this.container.getParent()) {
      return this.container.getParent()!.resolve<T>(token);
    }

    throw new Error(`No binding found for token: ${token.toString()}`);
  }

  /**
   * Try to resolve an instance for a token, return undefined if not bound
   */
  tryResolve<T>(token: Token<T>): T | undefined {
    try {
      return this.resolve<T>(token);
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Resolve an instance asynchronously
   */
  async resolveAsync<T>(token: Token<T>): Promise<T> {
    // Try to find the binding
    const binding = this.bindingManager.getBinding(token);

    if (binding) {
      return this.resolveBindingAsync<T>(binding);
    }

    // If not found and we have a parent, try to resolve from parent
    if (this.container.getParent()) {
      return this.container.getParent()!.resolveAsync<T>(token);
    }

    throw new Error(`No binding found for token: ${token.toString()}`);
  }

  /**
   * Internal method to resolve a binding synchronously
   */
  private resolveBinding<T>(binding: Binding<T>): T {
    // For singletons, return cached instance if available
    if (binding.scope === BindingScope.Singleton && binding.cachedInstance) {
      return binding.cachedInstance;
    }

    let instance: T;

    switch (binding.type) {
      case BindingType.Value:
        instance = binding.value;
        break;

      case BindingType.Factory:
        if (!binding.factory) {
          throw new Error(
            `Factory binding for ${binding.token.toString()} has no factory function`
          );
        }
        const result = binding.factory(this.container);

        // If the factory returns a promise, we can't handle it here
        if (result instanceof Promise) {
          throw new Error(
            `Factory for ${binding.token.toString()} returned a Promise, use resolveAsync instead`
          );
        }

        instance = result;
        break;

      case BindingType.Class:
        if (!binding.implementation) {
          throw new Error(
            `Class binding for ${binding.token.toString()} has no implementation class`
          );
        }
        instance = this.instanceCreator.createInstance(binding.implementation);
        break;

      default:
        throw new Error(`Unknown binding type: ${binding.type}`);
    }

    // Cache instance for singletons
    if (binding.scope === BindingScope.Singleton) {
      binding.cachedInstance = instance;
    }

    return instance;
  }

  /**
   * Internal method to resolve a binding asynchronously
   */
  private async resolveBindingAsync<T>(binding: Binding<T>): Promise<T> {
    if (binding.scope === BindingScope.Singleton && binding.cachedInstance) {
      return binding.cachedInstance;
    }

    let instance: T;

    switch (binding.type) {
      case BindingType.Value:
        instance = binding.value;
        break;

      case BindingType.Factory:
        if (!binding.factory) {
          throw new Error(
            `Factory binding for ${binding.token.toString()} has no factory function`
          );
        }
        instance = await binding.factory(this.container);
        break;

      case BindingType.Class:
        if (!binding.implementation) {
          throw new Error(
            `Class binding for ${binding.token.toString()} has no implementation class`
          );
        }
        instance = this.instanceCreator.createInstance(binding.implementation);
        break;

      default:
        throw new Error(`Unknown binding type: ${binding.type}`);
    }

    // Cache instance for singletons
    if (binding.scope === BindingScope.Singleton) {
      binding.cachedInstance = instance;
    }

    return instance;
  }
}
