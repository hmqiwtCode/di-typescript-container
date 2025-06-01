import {
  BindingBuilder,
  Container,
  ScopeBuilder,
} from "../../interfaces/container";
import { Constructor, Token } from "../../interfaces/token";
import {
  Binding,
  BindingType,
  Factory,
  BindingScope,
} from "../../interfaces/binding";
import { BindingManager } from "./binding-manager";
import { ScopeBuilderImpl } from "./scope-builder";

/**
 * Implementation of the BindingBuilder interface
 */
export class BindingBuilderImpl<T> implements BindingBuilder<T> {
  private binding: Binding<T>;

  constructor(
    private container: Container,
    private bindingManager: BindingManager,
    token: Token<T>
  ) {
    this.binding = {
      token,
      type: BindingType.Class,
      scope: BindingScope.Transient,
    };
  }

  /**
   * Bind to a class implementation
   */
  toClass(ctor: Constructor<T>): ScopeBuilder<T> {
    this.binding.type = BindingType.Class;
    this.binding.implementation = ctor;
    return new ScopeBuilderImpl<T>(
      this.container,
      this.bindingManager,
      this.binding
    );
  }

  /**
   * Bind to a value
   */
  toValue(value: T): void {
    this.binding.type = BindingType.Value;
    this.binding.value = value;
    // For values, we register immediately (no scope needed)
    this.bindingManager.registerBinding(this.binding);
  }

  /**
   * Bind to a factory function
   */
  toFactory(factory: Factory<T>): ScopeBuilder<T> {
    this.binding.type = BindingType.Factory;
    this.binding.factory = factory;
    return new ScopeBuilderImpl<T>(
      this.container,
      this.bindingManager,
      this.binding
    );
  }
}
