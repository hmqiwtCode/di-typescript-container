import "reflect-metadata";
import { Token } from "../interfaces/token";
import { PROPERTY_INJECTIONS_METADATA_KEY } from "../utils/constants";

/**
 * For storing property injection metadata
 */
interface PropertyInjectionMetadata {
  propertyKey: string | symbol;
  token: Token<any>;
}

/**
 * Decorator for property injection
 * Used to break circular dependencies through setter injection
 */
export function InjectProperty(token: Token<any>) {
  return function (target: any, propertyKey: string | symbol) {
    const propertyInjections: PropertyInjectionMetadata[] =
      Reflect.getOwnMetadata(
        PROPERTY_INJECTIONS_METADATA_KEY,
        target.constructor
      ) || [];

    propertyInjections.push({
      propertyKey,
      token,
    });

    Reflect.defineMetadata(
      PROPERTY_INJECTIONS_METADATA_KEY,
      propertyInjections,
      target.constructor
    );
  };
}
