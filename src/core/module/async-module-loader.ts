import { Container, AsyncContainerModule } from "../../interfaces/container";

/**
 * Handles loading of asynchronous container modules
 */
export class AsyncModuleLoader {
  constructor(private container: Container) {}

  /**
   * Load an async module into the container
   */
  async loadAsyncModule(module: AsyncContainerModule): Promise<void> {
    await module.load(this.container);
  }

  /**
   * Load multiple async modules into the container
   */
  async loadAsyncModules(modules: AsyncContainerModule[]): Promise<void> {
    for (const module of modules) {
      await this.loadAsyncModule(module);
    }
  }
}
