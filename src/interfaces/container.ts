import { BindingScope } from "./binding";
import { Constructor, Token } from "./token";

/**
 * Forward declarations to avoid circular dependencies
 */
export interface ContainerModule {
  load(container: Container): void;
}

export interface AsyncContainerModule {
  load(container: Container): Promise<void>;
}

/**
 * Fluent interface for binding configuration
 */
export interface BindingBuilder<T> {
  toClass(ctor: Constructor<T>): ScopeBuilder<T>;
  toValue(value: T): void;
  toFactory(factory: (container: Container) => T | Promise<T>): ScopeBuilder<T>;
}

/**
 * Fluent interface for scope configuration
 */
export interface ScopeBuilder<T> {
  inSingletonScope(): void;
  inTransientScope(): void;
  inRequestScope(): void;
}

/**
 * Interface for the dependency injection container
 */
export interface Container {
  /**
   * Bind a token to an implementation
   */
  bind<T>(token: Token<T>): BindingBuilder<T>;

  /**
   * Check if a token is bound in the container
   */
  isBound<T>(token: Token<T>): boolean;

  /**
   * Resolve an instance for a token
   */
  resolve<T>(token: Token<T>): T;

  /**
   * Try to resolve an instance for a token, return undefined if not bound
   */
  tryResolve<T>(token: Token<T>): T | undefined;

  /**
   * Resolve an instance asynchronously
   */
  resolveAsync<T>(token: Token<T>): Promise<T>;

  /**
   * Unbind a token from the container
   */
  unbind(token: Token<any>): void;

  /**
   * Rebind a token (unbind and then bind)
   */
  rebind<T>(token: Token<T>): BindingBuilder<T>;

  /**
   * Create a child container
   */
  createChildContainer(): Container;

  /**
   * Get the parent container if exists
   */
  getParent(): Container | null;

  /**
   * Load a module into the container
   */
  loadModule(module: ContainerModule): void;

  /**
   * Load multiple modules into the container
   */
  loadModules(modules: ContainerModule[]): void;

  /**
   * Load an async module into the container
   */
  loadAsyncModule(module: AsyncContainerModule): Promise<void>;

  /**
   * Load multiple async modules into the container
   */
  loadAsyncModules(modules: AsyncContainerModule[]): Promise<void>;
}
