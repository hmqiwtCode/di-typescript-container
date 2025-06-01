import { Container } from "../interfaces/container";
import { ContainerModule, ContainerModuleCallback } from "./container-module";

/**
 * A module that loads only when a condition is met
 * @param condition - A function that returns true if the module should be loaded
 * @param callback - A function that can be used to bind services to a container
 */
export class ConditionalModule extends ContainerModule {
  constructor(
    private readonly condition: () => boolean,
    callback: ContainerModuleCallback
  ) {
    super(callback);
  }

  /**
   * Load this module into a container only if the condition is true
   * @param container - The container to load this module into
   */
  load(container: Container): void {
    if (this.condition()) {
      super.load(container);
    }
  }
}
