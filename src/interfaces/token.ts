/**
 * Type to represent a token used for binding and resolving dependencies
 */
export type Token<T = any> =
  | string
  | symbol
  | Constructor<T>
  | InjectionToken<T>;

/**
 * Type to represent a constructor function
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Named token for identifying dependencies when strings or classes are not appropriate
 */
export class InjectionToken<T = any> {
  constructor(private readonly _desc: string) {}

  toString(): string {
    return `InjectionToken(${this._desc})`;
  }
}
