import "reflect-metadata";
import { Constructor } from "../interfaces/token";
import {
  DESIGN_PARAM_TYPES,
  INJECTABLE_METADATA_KEY,
  NAMED_DEPS_METADATA_KEY,
  OPTIONAL_DEPS_METADATA_KEY,
  PARAM_TYPES_METADATA_KEY,
  LAZY_DEPS_METADATA_KEY,
  PROPERTY_INJECTIONS_METADATA_KEY,
} from "./constants";

/**
 * Utility functions for working with reflection metadata
 */
export class MetadataReader {
  /**
   * Check if a class is marked as injectable
   */
  static isInjectable(target: Constructor<any>): boolean {
    return !!Reflect.getMetadata(INJECTABLE_METADATA_KEY, target);
  }

  /**
   * Get the parameter types for a constructor
   */
  static getParameterTypes(target: Constructor<any>): any[] {
    return Reflect.getMetadata(DESIGN_PARAM_TYPES, target) || [];
  }

  /**
   * Get token overrides from @Inject decorators
   */
  static getInjectTokens(target: Constructor<any>): any[] {
    return Reflect.getMetadata(PARAM_TYPES_METADATA_KEY, target) || [];
  }

  /**
   * Get the optional parameter indexes
   */
  static getOptionalParameters(target: Constructor<any>): Set<number> {
    return (
      Reflect.getMetadata(OPTIONAL_DEPS_METADATA_KEY, target) ||
      new Set<number>()
    );
  }

  /**
   * Get the named parameter indexes and their names
   */
  static getNamedParameters(target: Constructor<any>): Map<number, string> {
    return (
      Reflect.getMetadata(NAMED_DEPS_METADATA_KEY, target) ||
      new Map<number, string>()
    );
  }

  /**
   * Get the lazy parameter indexes
   */
  static getLazyParameters(target: Constructor<any>): Set<number> {
    return (
      Reflect.getMetadata(LAZY_DEPS_METADATA_KEY, target) || new Set<number>()
    );
  }

  /**
   * Get property injections
   */
  static getPropertyInjections(target: Constructor<any>): any[] {
    return Reflect.getMetadata(PROPERTY_INJECTIONS_METADATA_KEY, target) || [];
  }
}
