import { Container, ContainerModule } from "../../interfaces/container";

/**
 * Handles loading of synchronous container modules
 */
export class ModuleLoader {
  constructor(private container: Container) {}

  /**
   * Load a module into the container
   */
  loadModule(module: ContainerModule): void {
    module.load(this.container);
  }

  /**
   * Load multiple modules into the container
   */
  loadModules(modules: ContainerModule[]): void {
    modules.forEach((module) => this.loadModule(module));
  }
}
