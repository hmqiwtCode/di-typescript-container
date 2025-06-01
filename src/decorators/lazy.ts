import "reflect-metadata";
import {
  LAZY_DEPS_METADATA_KEY,
  PARAM_TYPES_METADATA_KEY,
  DESIGN_PARAM_TYPES,
} from "../utils/constants";
import { Token, InjectionToken } from "../interfaces/token";

/**
 * Stores a copy of the token so it's not lost during lazy resolution
 */
export const LAZY_TOKEN_STORAGE = new Map<string, Token<any>>();

/**
 * Generate a unique key for a parameter
 */
export function getTokenKey(target: any, parameterIndex: number): string {
  const className =
    target.name ||
    target.constructor?.name ||
    (typeof target === "function" ? target.toString() : "unknown");
  return `${className}_${parameterIndex}`;
}

/**
 * Marks a dependency as lazily injected to handle circular dependencies
 * The dependency will be resolved when first accessed, not during object creation
 *
 * @param token Optional token for the dependency (can be omitted when used with @Inject)
 * @returns A decorator function
 */
export function Lazy(token?: Token<any>) {
  return function (
    target: any,
    _: string | symbol | undefined,
    parameterIndex: number
  ) {
    const tokenKey = getTokenKey(target, parameterIndex);

    const lazyParams: Set<number> =
      Reflect.getOwnMetadata(LAZY_DEPS_METADATA_KEY, target) ||
      new Set<number>();

    lazyParams.add(parameterIndex);

    Reflect.defineMetadata(LAZY_DEPS_METADATA_KEY, lazyParams, target);

    if (token) {
      const existingParamTypes: Array<Token<any>> =
        Reflect.getOwnMetadata(PARAM_TYPES_METADATA_KEY, target) || [];

      const paramTypes = [...existingParamTypes];
      paramTypes[parameterIndex] = token;

      LAZY_TOKEN_STORAGE.set(tokenKey, token);

      Reflect.defineMetadata(PARAM_TYPES_METADATA_KEY, paramTypes, target);

      if (token instanceof InjectionToken) {
        Reflect.defineMetadata(`__lazyToken_${parameterIndex}`, token, target);
      }
    }
    // Otherwise, we need to ensure we have the correct design:paramtypes
    else {
      const designParamTypes =
        Reflect.getMetadata(DESIGN_PARAM_TYPES, target) || [];

      if (designParamTypes && designParamTypes[parameterIndex]) {
        const existingParamTypes: Array<Token<any>> =
          Reflect.getOwnMetadata(PARAM_TYPES_METADATA_KEY, target) || [];

        const paramTypes = [...existingParamTypes];
        paramTypes[parameterIndex] = designParamTypes[parameterIndex];

        LAZY_TOKEN_STORAGE.set(tokenKey, designParamTypes[parameterIndex]);

        Reflect.defineMetadata(PARAM_TYPES_METADATA_KEY, paramTypes, target);
      }
    }
  };
}
