import { Container } from "../interfaces/container";

/**
 * Defines a function that can bind services to a container
 * @param container - The container to bind services to
 * @returns A function that can be used to bind services to a container
 */
export type ContainerModuleCallback = (container: Container) => void;

/**
 * A module represents a collection of bindings that can be loaded into a container
 * @param callback - A function that can be used to bind services to a container
 */
export class ContainerModule {
  constructor(private readonly callback: ContainerModuleCallback) {}

  /**
   * Load this module into a container
   * @param container - The container to load this module into
   */
  load(container: Container): void {
    this.callback(container);
  }
}
