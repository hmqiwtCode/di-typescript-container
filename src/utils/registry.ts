import { Constructor, Token, InjectionToken } from "../interfaces/token";
import { BindingScope } from "../interfaces/binding";

/**
 * Registry to track all classes marked with @Injectable
 */
export class InjectableRegistry {
  private static injectables: Map<Constructor<any>, { scope?: BindingScope }> =
    new Map();

  // Store token to class mappings for auto-injection
  private static tokenMappings: Map<Token<any>, Constructor<any>> = new Map();

  /**
   * Register a class as injectable
   */
  static register(
    target: Constructor<any>,
    options: { scope?: BindingScope; token?: Token<any> } = {}
  ): void {
    InjectableRegistry.injectables.set(target, { scope: options.scope });

    // If a token is provided, register the token -> class mapping
    if (options.token) {
      InjectableRegistry.registerTokenMapping(options.token, target);
    }
  }

  /**
   * Register a token to class mapping for auto-injection
   */
  static registerTokenMapping(
    token: Token<any>,
    implementation: Constructor<any>
  ): void {
    InjectableRegistry.tokenMappings.set(token, implementation);
  }

  /**
   * Get class implementation for a token
   */
  static getImplementationForToken(
    token: Token<any>
  ): Constructor<any> | undefined {
    return InjectableRegistry.tokenMappings.get(token);
  }

  /**
   * Check if a token has a registered implementation
   */
  static hasImplementationForToken(token: Token<any>): boolean {
    return InjectableRegistry.tokenMappings.has(token);
  }

  /**
   * Check if a class is registered
   */
  static isRegistered(target: Constructor<any>): boolean {
    return InjectableRegistry.injectables.has(target);
  }

  /**
   * Get registration options for a class
   */
  static getOptions(
    target: Constructor<any>
  ): { scope?: BindingScope } | undefined {
    return InjectableRegistry.injectables.get(target);
  }

  /**
   * Get all registered injectable classes
   */
  static getInjectables(): Map<Constructor<any>, { scope?: BindingScope }> {
    return new Map(InjectableRegistry.injectables);
  }

  /**
   * Get all token to class mappings
   */
  static getTokenMappings(): Map<Token<any>, Constructor<any>> {
    return new Map(InjectableRegistry.tokenMappings);
  }
}
