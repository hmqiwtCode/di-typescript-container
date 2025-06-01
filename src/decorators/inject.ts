import "reflect-metadata";
import { PARAM_TYPES_METADATA_KEY } from "../utils/constants";
import { Token } from "../interfaces/token";

/**
 * Specifies the token to use when injecting a dependency
 * @param token - The token to use when injecting a dependency
 * @returns A decorator function that can be used to inject a dependency
 */
export function Inject(token: Token<any>) {
  return function (
    target: any,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const existingParamTypes: Array<Token<any>> =
      Reflect.getOwnMetadata(PARAM_TYPES_METADATA_KEY, target) || [];

    const paramTypes = [...existingParamTypes];

    paramTypes[parameterIndex] = token;

    Reflect.defineMetadata(PARAM_TYPES_METADATA_KEY, paramTypes, target);
  };
}
