import { Constructor, Token, InjectionToken } from "../../interfaces/token";
import { Container } from "../../interfaces/container";
import { MetadataReader } from "../../utils/metadata";
import { PropertyInjector } from "./property-injector";
import { LAZY_TOKEN_STORAGE, getTokenKey } from "../../decorators/lazy";

/**
 * Creates instances with constructor dependency injection
 */
export class InstanceCreator {
  private propertyInjector: PropertyInjector;

  constructor(private container: Container) {
    this.propertyInjector = new PropertyInjector(container);
  }

  /**
   * Create a proxy for lazy resolution to handle circular dependencies
   */
  createLazyProxy<T>(
    token: Token<T>,
    targetClass?: any,
    paramIndex?: number
  ): T {
    const container = this.container;
    let resolvedInstance: T | null = null;

    let originalToken = token;

    if (targetClass && paramIndex !== undefined) {
      const explicitToken = Reflect.getMetadata(
        `__lazyToken_${paramIndex}`,
        targetClass
      );
      if (explicitToken) {
        originalToken = explicitToken;
      } else {
        const tokenKey = getTokenKey(targetClass, paramIndex);
        const storedToken = LAZY_TOKEN_STORAGE.get(tokenKey);
        if (storedToken) {
          originalToken = storedToken;
        }
      }
    }

    // Create a proxy that will lazily resolve the dependency
    const proxy = new Proxy({} as any, {
      get(target: any, prop: string | symbol) {
        if (prop === "toString" || prop === Symbol.toStringTag) {
          return () => `LazyProxy(${String(originalToken)})`;
        }

        if (prop === "constructor") {
          return { name: `LazyProxy<${String(originalToken)}>` };
        }

        // Lazily resolve the instance when first accessed
        if (!resolvedInstance) {
          try {
            if (
              originalToken instanceof InjectionToken ||
              typeof originalToken === "symbol" ||
              typeof originalToken === "string"
            ) {
              resolvedInstance = container.resolve(originalToken);
            } else {
              // For class-based tokens that may have been lost in the proxying process
              resolvedInstance =
                container.resolve(originalToken) || container.resolve(token);
            }
          } catch (error) {
            console.error(
              `Error resolving lazy dependency: ${String(originalToken)}`,
              error
            );
            throw error;
          }
        }
        return Reflect.get(resolvedInstance as object, prop);
      },
      set(target: any, prop: string | symbol, value: any) {
        if (!resolvedInstance) {
          try {
            if (
              originalToken instanceof InjectionToken ||
              typeof originalToken === "symbol" ||
              typeof originalToken === "string"
            ) {
              resolvedInstance = container.resolve(originalToken);
            } else {
              resolvedInstance =
                container.resolve(originalToken) || container.resolve(token);
            }
          } catch (error) {
            console.error(
              `Error resolving lazy dependency: ${String(originalToken)}`,
              error
            );
            throw error;
          }
        }
        return Reflect.set(resolvedInstance as object, prop, value);
      },
    });

    return proxy;
  }

  /**
   * Create an instance of a class by resolving its dependencies
   */
  createInstance<T>(ctor: Constructor<T>): T {
    if (!MetadataReader.isInjectable(ctor)) {
      throw new Error(`Class ${ctor.name} is not marked as @Injectable`);
    }

    // Get the types of constructor parameters
    const paramTypes = MetadataReader.getParameterTypes(ctor);

    // Get any token overrides from @Inject decorators
    const injectedTokens = MetadataReader.getInjectTokens(ctor);

    // Get optional parameter indexes
    const optionalParams = MetadataReader.getOptionalParameters(ctor);

    // Get lazy parameter indexes
    const lazyParams = MetadataReader.getLazyParameters(ctor);

    // Get named parameter indexes and their names
    const namedParams = MetadataReader.getNamedParameters(ctor);

    // Resolve the dependencies
    const args = paramTypes.map((paramType, index) => {
      // Use token override from @Inject if available
      const token = injectedTokens[index] || paramType;

      // For named injections, we create a new token that includes the name
      const name = namedParams.get(index);
      const finalToken = name ? `${String(token)}:${name}` : token;

      // Check if this is a lazy parameter
      if (lazyParams.has(index)) {
        // For lazy parameters, create a proxy that will resolve on demand
        return this.createLazyProxy(finalToken, ctor, index);
      }

      try {
        return this.container.resolve(finalToken);
      } catch (error: any) {
        // If the parameter is optional, return undefined
        if (optionalParams.has(index)) {
          return undefined;
        }

        // Otherwise, rethrow the error with more context
        throw new Error(
          `Error resolving dependency at position ${index} for ${ctor.name}: ${error.message}`
        );
      }
    });

    // Create a new instance with the resolved dependencies
    const instance = new ctor(...args);

    // Handle property injections to break circular dependencies
    this.propertyInjector.injectProperties(ctor, instance);

    return instance;
  }
}
