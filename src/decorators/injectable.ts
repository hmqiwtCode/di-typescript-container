import "reflect-metadata";
import { INJECTABLE_METADATA_KEY } from "../utils/constants";
import { InjectableRegistry } from "../utils/registry";
import { BindingScope } from "../interfaces/binding";
import { Token, InjectionToken } from "../interfaces/token";

/**
 * Options for the Injectable decorator
 */
export interface InjectableOptions {
  /**
   * The scope of the injectable (singleton, transient, etc.)
   */
  scope?: BindingScope;

  /**
   * Whether to auto-register the injectable in the default container
   * Default: true
   */
  autoRegister?: boolean;

  /**
   * Optional token to use for binding this class
   */
  token?: Token<any>;
}

/**
 * Marks a class as injectable so that its constructor dependencies can be resolved
 *
 * @param optionsOrToken Options for the injectable or a token to use for binding
 */
export function Injectable(
  optionsOrToken: InjectableOptions | Token<any> = {}
) {
  return function (target: any) {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target);

    let options: InjectableOptions;

    if (
      typeof optionsOrToken === "object" &&
      !(optionsOrToken instanceof Symbol) &&
      !(optionsOrToken instanceof InjectionToken) &&
      !Array.isArray(optionsOrToken)
    ) {
      options = optionsOrToken as InjectableOptions;
    } else {
      options = { token: optionsOrToken as Token<any> };
    }

    const autoRegister = options.autoRegister !== false;
    if (autoRegister) {
      InjectableRegistry.register(target, {
        scope: options.scope,
        token: options.token,
      });

      if (options.token) {
        InjectableRegistry.registerTokenMapping(options.token, target);
      }
    }

    return target;
  };
}
