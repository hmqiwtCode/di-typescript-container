import { Binding } from "../../interfaces/binding";
import { Token } from "../../interfaces/token";

/**
 * Manages storing and retrieving bindings
 */
export class BindingManager {
  private bindings = new Map<Token<any>, Binding<any>>();

  /**
   * Store a binding
   */
  registerBinding<T>(binding: Binding<T>): void {
    this.bindings.set(binding.token, binding);
  }

  /**
   * Get a binding by token
   */
  getBinding<T>(token: Token<T>): Binding<T> | undefined {
    return this.bindings.get(token) as Binding<T> | undefined;
  }

  /**
   * Check if a token is bound
   */
  hasBinding<T>(token: Token<T>): boolean {
    return this.bindings.has(token);
  }

  /**
   * Remove a binding
   */
  removeBinding(token: Token<any>): void {
    this.bindings.delete(token);
  }

  /**
   * Get all bindings
   */
  getAllBindings(): Map<Token<any>, Binding<any>> {
    return new Map(this.bindings);
  }
}
