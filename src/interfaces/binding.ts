import { Constructor, Token } from "./token";

/**
 * Scope of a binding
 */
export enum BindingScope {
  Singleton = "singleton",
  Transient = "transient",
  Request = "request",
}

/**
 * Type of binding
 */
export enum BindingType {
  Class = "class",
  Value = "value",
  Factory = "factory",
}

/**
 * A factory function for creating instances
 */
export type Factory<T = any> = (container: any) => T | Promise<T>;

/**
 * Interface for binding configuration
 */
export interface Binding<T = any> {
  token: Token<T>;
  type: BindingType;
  scope: BindingScope;

  // Value depends on the binding type
  value?: any;
  factory?: Factory<T>;
  implementation?: Constructor<T>;

  // Cache for singleton instances
  cachedInstance?: T;

  // Additional metadata
  metadata?: Map<any, any>;
}
