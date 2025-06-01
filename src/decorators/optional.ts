import "reflect-metadata";
import { OPTIONAL_DEPS_METADATA_KEY } from "../utils/constants";

/**
 * Marks a dependency as optional
 * When resolving, if the dependency is not found, undefined is injected instead of throwing an error
 */
export function Optional() {
  return function (
    target: any,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const optionalParams: Set<number> =
      Reflect.getOwnMetadata(OPTIONAL_DEPS_METADATA_KEY, target) ||
      new Set<number>();

    optionalParams.add(parameterIndex);

    Reflect.defineMetadata(OPTIONAL_DEPS_METADATA_KEY, optionalParams, target);
  };
}
