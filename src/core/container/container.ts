import "reflect-metadata";
import {
  BindingBuilder,
  Container,
  ContainerModule,
  AsyncContainerModule,
} from "../../interfaces/container";
import { Token, Constructor } from "../../interfaces/token";
import { BaseContainer } from "./base-container";
import { BindingManager } from "../binding/binding-manager";
import { BindingBuilderImpl } from "../binding/binding-builder";
import { ModuleLoader } from "../module/module-loader";
import { AsyncModuleLoader } from "../module/async-module-loader";
import { DependencyResolver } from "../resolution/resolver";
import { InjectableRegistry } from "../../utils/registry";
import { BindingScope } from "../../interfaces/binding";

/**
 * Configuration options for the DIContainer
 */
export interface DIContainerOptions {
  /**
   * Whether to automatically register all injectables when they're requested
   * but not explicitly bound
   */
  autoResolve?: boolean;

  /**
   * Default scope for auto-registered injectables
   */
  defaultScope?: BindingScope;
}

/**
 * Implementation of the Container interface
 */
export class DIContainer extends BaseContainer implements Container {
  protected _parent: Container | null = null;

  private moduleLoader: ModuleLoader;
  private asyncModuleLoader: AsyncModuleLoader;
  protected resolver: DependencyResolver;
  private options: DIContainerOptions;

  constructor(options: DIContainerOptions = {}) {
    super();
    this.bindingManager = new BindingManager();
    this.resolver = new DependencyResolver(this, this.bindingManager);
    this.moduleLoader = new ModuleLoader(this);
    this.asyncModuleLoader = new AsyncModuleLoader(this);
    this.options = {
      autoResolve: true,
      defaultScope: BindingScope.Singleton,
      ...options,
    };
  }

  /**
   * Bind a token to an implementation
   */
  bind<T>(token: Token<T>): BindingBuilder<T> {
    return new BindingBuilderImpl<T>(this, this.bindingManager, token);
  }

  /**
   * Check if a token is bound in this container or its parent
   */
  isBound<T>(token: Token<T>): boolean {
    return (
      this.bindingManager.hasBinding(token) ||
      (!!this.getParent() && this.getParent()!.isBound(token))
    );
  }

  /**
   * Auto-register an injectable class if not already bound
   * @private
   */
  private autoRegisterIfNeeded<T>(token: Token<T>): boolean {
    if (!this.options.autoResolve) {
      return false;
    }

    if (this.isBound(token)) {
      return false;
    }

    // Handle direct class tokens
    if (typeof token === "function") {
      const constructorToken = token as Constructor<T>;
      if (!InjectableRegistry.isRegistered(constructorToken)) {
        return false;
      }

      const options = InjectableRegistry.getOptions(constructorToken);
      const scope = options?.scope || this.options.defaultScope;

      const binding = this.bind(constructorToken).toClass(constructorToken);

      if (scope === BindingScope.Singleton) {
        binding.inSingletonScope();
      } else if (scope === BindingScope.Transient) {
        binding.inTransientScope();
      } else if (scope === BindingScope.Request) {
        binding.inRequestScope();
      }

      return true;
    }

    // Handle token to implementation mappings
    const implementation = InjectableRegistry.getImplementationForToken(token);
    if (implementation) {
      const options = InjectableRegistry.getOptions(implementation);
      const scope = options?.scope || this.options.defaultScope;

      const binding = this.bind(token).toClass(implementation);

      if (scope === BindingScope.Singleton) {
        binding.inSingletonScope();
      } else if (scope === BindingScope.Transient) {
        binding.inTransientScope();
      } else if (scope === BindingScope.Request) {
        binding.inRequestScope();
      }

      return true;
    }

    return false;
  }

  /**
   * Resolve an instance for a token
   */
  resolve<T>(token: Token<T>): T {
    this.autoRegisterIfNeeded(token);
    return this.resolver.resolve(token);
  }

  /**
   * Try to resolve an instance for a token, return undefined if not bound
   */
  tryResolve<T>(token: Token<T>): T | undefined {
    // Try to auto-register if needed
    this.autoRegisterIfNeeded(token);
    return this.resolver.tryResolve(token);
  }

  /**
   * Resolve an instance asynchronously
   */
  async resolveAsync<T>(token: Token<T>): Promise<T> {
    // Try to auto-register if needed
    this.autoRegisterIfNeeded(token);
    return this.resolver.resolveAsync(token);
  }

  /**
   * Unbind a token from the container
   */
  unbind(token: Token<any>): void {
    this.bindingManager.removeBinding(token);
  }

  /**
   * Rebind a token (unbind and then bind)
   */
  rebind<T>(token: Token<T>): BindingBuilder<T> {
    this.unbind(token);
    return this.bind<T>(token);
  }

  /**
   * Create a child container
   */
  createChildContainer(): Container {
    const child = new DIContainer(this.options);
    (child as any)._parent = this;
    return child;
  }

  /**
   * Get the parent container if exists
   */
  getParent(): Container | null {
    return this._parent;
  }

  /**
   * Load a module into the container
   */
  loadModule(module: ContainerModule): void {
    this.moduleLoader.loadModule(module);
  }

  /**
   * Load multiple modules into the container
   */
  loadModules(modules: ContainerModule[]): void {
    this.moduleLoader.loadModules(modules);
  }

  /**
   * Load an async module into the container
   */
  async loadAsyncModule(module: AsyncContainerModule): Promise<void> {
    await this.asyncModuleLoader.loadAsyncModule(module);
  }

  /**
   * Load multiple async modules into the container
   */
  async loadAsyncModules(modules: AsyncContainerModule[]): Promise<void> {
    await this.asyncModuleLoader.loadAsyncModules(modules);
  }

  /**
   * Register all injectable classes from the registry
   */
  autoRegisterAll(): void {
    const injectables = InjectableRegistry.getInjectables();

    for (const [cls, options] of injectables.entries()) {
      if (this.isBound(cls)) {
        continue;
      }

      const binding = this.bind(cls).toClass(cls);
      const scope = options.scope || this.options.defaultScope;

      if (scope === BindingScope.Singleton) {
        binding.inSingletonScope();
      } else if (scope === BindingScope.Transient) {
        binding.inTransientScope();
      } else if (scope === BindingScope.Request) {
        binding.inRequestScope();
      }
    }

    // Register all token mappings
    const tokenMappings = InjectableRegistry.getTokenMappings();

    for (const [token, implementation] of tokenMappings.entries()) {
      // Skip if already bound
      if (this.isBound(token)) {
        continue;
      }

      const options = InjectableRegistry.getOptions(implementation);
      const scope = options?.scope || this.options.defaultScope;

      const binding = this.bind(token).toClass(implementation);

      if (scope === BindingScope.Singleton) {
        binding.inSingletonScope();
      } else if (scope === BindingScope.Transient) {
        binding.inTransientScope();
      } else if (scope === BindingScope.Request) {
        binding.inRequestScope();
      }
    }
  }
}
