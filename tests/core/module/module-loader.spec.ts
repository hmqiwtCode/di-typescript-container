import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import {
  Container,
  ContainerModule,
  AsyncContainerModule,
} from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectionToken } from "../../../src/interfaces/token";

const VALUE_TOKEN = new InjectionToken<string>("value");
const ASYNC_VALUE_TOKEN = new InjectionToken<string>("asyncValue");

@Injectable()
class ModuleService {
  getValue(): string {
    return "module-service";
  }
}

describe("Module Loading", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should load a module and register its bindings", () => {
    const module: ContainerModule = {
      load: (container: Container) => {
        container.bind(ModuleService).toClass(ModuleService).inTransientScope();
        container.bind(VALUE_TOKEN).toValue("test-value");
      },
    };

    container.loadModule(module);

    expect(container.isBound(ModuleService)).toBeTruthy();
    expect(container.isBound(VALUE_TOKEN)).toBeTruthy();
    expect(container.resolve(VALUE_TOKEN)).toBe("test-value");
  });

  it("should load multiple modules", () => {
    const module1: ContainerModule = {
      load: (container: Container) => {
        container.bind(ModuleService).toClass(ModuleService).inTransientScope();
      },
    };

    const module2: ContainerModule = {
      load: (container: Container) => {
        container.bind(VALUE_TOKEN).toValue("test-value");
      },
    };

    container.loadModules([module1, module2]);

    expect(container.isBound(ModuleService)).toBeTruthy();
    expect(container.isBound(VALUE_TOKEN)).toBeTruthy();
  });

  it("should load an async module", async () => {
    const asyncModule: AsyncContainerModule = {
      load: async (container: Container) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 10));
        container.bind(ASYNC_VALUE_TOKEN).toValue("async-value");
      },
    };

    await container.loadAsyncModule(asyncModule);

    expect(container.isBound(ASYNC_VALUE_TOKEN)).toBeTruthy();
    expect(container.resolve(ASYNC_VALUE_TOKEN)).toBe("async-value");
  });

  it("should load multiple async modules", async () => {
    const asyncModule1: AsyncContainerModule = {
      load: async (container: Container) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        container.bind(ModuleService).toClass(ModuleService).inTransientScope();
      },
    };

    const asyncModule2: AsyncContainerModule = {
      load: async (container: Container) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        container.bind(ASYNC_VALUE_TOKEN).toValue("async-value");
      },
    };

    await container.loadAsyncModules([asyncModule1, asyncModule2]);

    expect(container.isBound(ModuleService)).toBeTruthy();
    expect(container.isBound(ASYNC_VALUE_TOKEN)).toBeTruthy();
  });
});
