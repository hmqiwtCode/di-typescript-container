import "reflect-metadata";
import { NAMED_DEPS_METADATA_KEY } from "../utils/constants";

/**
 * Named injection decorator to distinguish between multiple bindings of the same type
 */
export function Named(name: string) {
  return function (
    target: any,
    _propertyKey: string | symbol | undefined,
    parameterIndex: number
  ) {
    const namedParams: Map<number, string> =
      Reflect.getOwnMetadata(NAMED_DEPS_METADATA_KEY, target) ||
      new Map<number, string>();

    namedParams.set(parameterIndex, name);

    Reflect.defineMetadata(NAMED_DEPS_METADATA_KEY, namedParams, target);
  };
}
