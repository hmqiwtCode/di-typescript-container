import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import {
  Container,
  ContainerModule,
  AsyncContainerModule,
} from "../../src/interfaces/container";
import { Injectable } from "../../src/decorators/injectable";
import { InjectionToken } from "../../src/interfaces/token";
import { ContainerModule as ContainerModuleImpl } from "../../src/modules/container-module";
import { AsyncContainerModuleImpl } from "../../src/modules/async-module";

// Define test tokens and services
const CONFIG_TOKEN = new InjectionToken<any>("Config");
const LOGGER_TOKEN = new InjectionToken<any>("Logger");
const SERVICE_TOKEN = new InjectionToken<any>("Service");

// Sample config
const testConfig = {
  apiUrl: "https://api.example.com",
  timeout: 5000,
};

// Sample logger
@Injectable()
class TestLogger {
  log(message: string): string {
    return `LOG: ${message}`;
  }
}

// Sample service
@Injectable()
class TestService {
  constructor(private logger: TestLogger, private config: any) {}

  getApiUrl(): string {
    return this.config.apiUrl;
  }

  logMessage(message: string): string {
    return this.logger.log(message);
  }
}

describe("Container Modules", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should create a container module using the factory", () => {
    
    const module = new ContainerModuleImpl((bind: Container) => {
      bind.bind(CONFIG_TOKEN).toValue(testConfig);
      bind.bind(LOGGER_TOKEN).toClass(TestLogger).inSingletonScope();
    });

    container.loadModule(module);

    expect(container.isBound(CONFIG_TOKEN)).toBeTruthy();
    expect(container.isBound(LOGGER_TOKEN)).toBeTruthy();
    expect(container.resolve(CONFIG_TOKEN)).toBe(testConfig);
  });

  it("should load multiple modules", () => {
    
    const configModule = new ContainerModuleImpl((bind: Container) => {
      bind.bind(CONFIG_TOKEN).toValue(testConfig);
    });

    const loggerModule = new ContainerModuleImpl((bind: Container) => {
      bind.bind(LOGGER_TOKEN).toClass(TestLogger).inSingletonScope();
    });

    container.loadModules([configModule, loggerModule]);

    expect(container.isBound(CONFIG_TOKEN)).toBeTruthy();
    expect(container.isBound(LOGGER_TOKEN)).toBeTruthy();
  });

  it("should create async modules", async () => {
    
    const asyncModule = new AsyncContainerModuleImpl(
      async (bind: Container) => {
        // Simulate async loading of configuration
        await new Promise((resolve) => setTimeout(resolve, 10));
        bind.bind(CONFIG_TOKEN).toValue(testConfig);
      }
    );

    await container.loadAsyncModule(asyncModule);

    expect(container.isBound(CONFIG_TOKEN)).toBeTruthy();
    expect(container.resolve(CONFIG_TOKEN)).toBe(testConfig);
  });

  it("should create modules with factory functions", () => {
    
    const serviceModule = new ContainerModuleImpl((bind: Container) => {
      bind.bind(CONFIG_TOKEN).toValue(testConfig);
      bind.bind(LOGGER_TOKEN).toClass(TestLogger).inSingletonScope();

      // Register a factory that depends on other services
      bind
        .bind(SERVICE_TOKEN)
        .toFactory((c: Container) => {
          const logger = c.resolve(LOGGER_TOKEN);
          const config = c.resolve(CONFIG_TOKEN);
          return new TestService(logger, config);
        })
        .inTransientScope();
    });

    container.loadModule(serviceModule);
    const service = container.resolve(SERVICE_TOKEN);

    expect(service).toBeDefined();
    expect(service.getApiUrl()).toBe("https://api.example.com");
    expect(service.logMessage("Hello")).toBe("LOG: Hello");
  });
});
