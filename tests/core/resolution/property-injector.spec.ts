import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectProperty } from "../../../src/decorators/inject-property";
import { InjectionToken } from "../../../src/interfaces/token";
import { PropertyInjector } from "../../../src/core/resolution/property-injector";
import { PROPERTY_INJECTIONS_METADATA_KEY } from "../../../src/utils/constants";

// Define test tokens
const CONFIG_TOKEN = new InjectionToken<any>("Config");
const LOGGER_TOKEN = new InjectionToken<any>("Logger");

// Define test values
const testConfig = { apiUrl: "https://api.example.com", timeout: 5000 };
const testLogger = { log: (msg: string) => `LOG: ${msg}` };

// Class with property injections
@Injectable()
class ServiceWithPropertyInjections {
  @InjectProperty(CONFIG_TOKEN)
  config: any;

  @InjectProperty(LOGGER_TOKEN)
  logger: any;

  constructor() {
    // These will be overridden by property injection
    this.config = null;
    this.logger = null;
  }

  getApiUrl(): string {
    return this.config?.apiUrl;
  }

  logMessage(msg: string): string {
    return this.logger?.log(msg);
  }
}

describe("PropertyInjector", () => {
  let container: Container;
  let propertyInjector: PropertyInjector;

  beforeEach(() => {
    container = new DIContainer();
    propertyInjector = new PropertyInjector(container);

    // Register test dependencies
    container.bind(CONFIG_TOKEN).toValue(testConfig);
    container.bind(LOGGER_TOKEN).toValue(testLogger);
  });

  it("should inject properties into an instance", () => {
    const service = new ServiceWithPropertyInjections();

    propertyInjector.injectProperties(ServiceWithPropertyInjections, service);

    expect(service.config).toBe(testConfig);
    expect(service.logger).toBe(testLogger);
    expect(service.getApiUrl()).toBe("https://api.example.com");
    expect(service.logMessage("test")).toBe("LOG: test");
  });

  it("should handle missing metadata gracefully", () => {
    class PlainClass {
      constructor() {}
    }
    const instance = new PlainClass();
    expect(() => {
      propertyInjector.injectProperties(PlainClass, instance);
    }).not.toThrow();
  });

  it("should inject properties when resolving via container", () => {
    container
      .bind(ServiceWithPropertyInjections)
      .toClass(ServiceWithPropertyInjections)
      .inTransientScope();

    const service = container.resolve(ServiceWithPropertyInjections);

    expect(service.config).toBe(testConfig);
    expect(service.logger).toBe(testLogger);
  });
});
