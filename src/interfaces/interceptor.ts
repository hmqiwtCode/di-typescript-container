import { InjectionToken } from "./token";
import { Container } from "./container";

/**
 * Represents the context of a method invocation
 */
export interface InvocationContext<T = any> {
  /**
   * The target object being invoked
   */
  target: any;

  /**
   * The method name being invoked
   */
  methodName: string | symbol;

  /**
   * The arguments passed to the method
   */
  args: any[];

  /**
   * The container instance
   */
  container: Container;

  /**
   * Original method on the target
   */
  proceed: (...args: any[]) => any;
}

/**
 * Interface for method interceptors
 */
export interface Interceptor {
  /**
   * Called before the target method is invoked
   * Return true to continue execution or false to cancel
   */
  beforeInvocation?(context: InvocationContext): boolean | Promise<boolean>;

  /**
   * Intercept the invocation
   * Can modify arguments, perform tasks before/after, or prevent execution
   */
  intercept(context: InvocationContext, next: () => any): any | Promise<any>;

  /**
   * Called after the target method has been invoked
   * Can modify the return value
   */
  afterInvocation?(
    context: InvocationContext,
    returnValue: any
  ): any | Promise<any>;
}

/**
 * Token for registering global interceptors
 */
export const INTERCEPTORS = new InjectionToken<Interceptor[]>("Interceptors");
