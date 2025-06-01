/**
 * Metadata key for marking a class as injectable
 */
export const INJECTABLE_METADATA_KEY = "di:injectable";

/**
 * Metadata key for storing parameter types
 * (automatically set by TypeScript with emitDecoratorMetadata)
 */
export const DESIGN_PARAM_TYPES = "design:paramtypes";

/**
 * Metadata key for parameter token overrides
 */
export const PARAM_TYPES_METADATA_KEY = "di:paramtypes";

/**
 * Metadata key for marking optional dependencies
 */
export const OPTIONAL_DEPS_METADATA_KEY = "di:optional";

/**
 * Metadata key for named dependencies
 */
export const NAMED_DEPS_METADATA_KEY = "di:named";

/**
 * Metadata key for marking dependencies as lazy (for circular dependencies)
 */
export const LAZY_DEPS_METADATA_KEY = "di:lazy";

/**
 * Metadata key for property/setter injections
 */
export const PROPERTY_INJECTIONS_METADATA_KEY = "di:property-injections";
