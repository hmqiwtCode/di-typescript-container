import { Container, ScopeBuilder } from "../../interfaces/container";
import { Binding, BindingScope } from "../../interfaces/binding";
import { BindingManager } from "./binding-manager";

/**
 * Implementation of the ScopeBuilder interface
 */
export class ScopeBuilderImpl<T> implements ScopeBuilder<T> {
  constructor(
    private container: Container,
    private bindingManager: BindingManager,
    private binding: Binding<T>
  ) {}

  /**
   * Use singleton scope (one instance per container)
   */
  inSingletonScope(): void {
    this.binding.scope = BindingScope.Singleton;
    this.bindingManager.registerBinding(this.binding);
  }

  /**
   * Use transient scope (new instance each time)
   */
  inTransientScope(): void {
    this.binding.scope = BindingScope.Transient;
    this.bindingManager.registerBinding(this.binding);
  }

  /**
   * Use request scope (one instance per resolution tree)
   */
  inRequestScope(): void {
    this.binding.scope = BindingScope.Request;
    this.bindingManager.registerBinding(this.binding);
  }
}
