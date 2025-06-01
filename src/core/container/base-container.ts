import "reflect-metadata";
import { Container, BindingBuilder } from "../../interfaces/container";
import { Token } from "../../interfaces/token";
import { BindingManager } from "../binding/binding-manager";

/**
 * Abstract base class for container implementations
 */
export abstract class BaseContainer implements Container {
  protected bindingManager!: BindingManager;

  /**
   * Bind a token to an implementation
   */
  abstract bind<T>(token: Token<T>): BindingBuilder<T>;

  /**
   * Check if a token is bound in this container or its parent
   */
  abstract isBound<T>(token: Token<T>): boolean;

  /**
   * Resolve an instance for a token
   */
  abstract resolve<T>(token: Token<T>): T;

  /**
   * Try to resolve an instance for a token, return undefined if not bound
   */
  abstract tryResolve<T>(token: Token<T>): T | undefined;

  /**
   * Resolve an instance asynchronously
   */
  abstract resolveAsync<T>(token: Token<T>): Promise<T>;

  /**
   * Unbind a token from the container
   */
  abstract unbind(token: Token<any>): void;

  /**
   * Rebind a token (unbind and then bind)
   */
  abstract rebind<T>(token: Token<T>): BindingBuilder<T>;

  /**
   * Create a child container
   */
  abstract createChildContainer(): Container;

  /**
   * Get the parent container if exists
   */
  abstract getParent(): Container | null;

  /**
   * Load a module into the container
   */
  abstract loadModule(module: any): void;

  /**
   * Load multiple modules into the container
   */
  abstract loadModules(modules: any[]): void;

  /**
   * Load an async module into the container
   */
  abstract loadAsyncModule(module: any): Promise<void>;

  /**
   * Load multiple async modules into the container
   */
  abstract loadAsyncModules(modules: any[]): Promise<void>;
}
