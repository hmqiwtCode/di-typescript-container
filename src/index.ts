import "reflect-metadata";

export * from "./interfaces";
export * from "./decorators";
export { DIContainer, DIContainerOptions } from "./core";
export * from "./modules";
export * from "./utils";
export { InjectableRegistry } from "./utils/registry";
export { InjectableOptions } from "./decorators/injectable";

// Export for debugging
export { LAZY_TOKEN_STORAGE } from "./decorators/lazy";

import { DIContainer } from "./core";

/**
 * Default container instance
 */
export const container = new DIContainer();

// Convenience method to pre-register all injectable classes
export function autoRegisterAll(): void {
  container.autoRegisterAll();
}
