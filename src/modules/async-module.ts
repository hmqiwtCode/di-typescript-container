import { AsyncContainerModule, Container } from "../interfaces/container";

/**
 * A module that loads asynchronously
 */
export class AsyncContainerModuleImpl implements AsyncContainerModule {
  constructor(
    private readonly callback: (container: Container) => Promise<void>
  ) {}

  /**
   * Load this module into a container asynchronously
   */
  async load(container: Container): Promise<void> {
    await this.callback(container);
  }
}
