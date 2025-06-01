import "reflect-metadata";
import { Interceptor } from "../interfaces/interceptor";

export const INTERCEPTORS_METADATA_KEY = "di:interceptors";

/**
 * Decorator for applying interceptors to methods
 * @param interceptors The interceptors to apply
 */
export function Intercept(...interceptors: Interceptor[]) {
  return function (
    target: any,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    Reflect.defineMetadata(
      INTERCEPTORS_METADATA_KEY,
      interceptors,
      target,
      propertyKey
    );

    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const interceptorChain = Reflect.getMetadata(
        INTERCEPTORS_METADATA_KEY,
        target,
        propertyKey
      ) as Interceptor[];

      if (!interceptorChain || interceptorChain.length === 0) {
        return originalMethod.apply(this, args);
      }

      const context = {
        target: this,
        methodName: propertyKey,
        args,
        container: (this as any).container,
        proceed: () => originalMethod.apply(this, args),
      };

      let index = 0;
      const next = () => {
        if (index < interceptorChain.length) {
          const interceptor = interceptorChain[index++];
          return interceptor.intercept(context, next);
        } else {
          return originalMethod.apply(this, args);
        }
      };

      return next();
    };

    return descriptor;
  };
}
