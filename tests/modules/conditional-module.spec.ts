import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container, ContainerModule } from "../../src/interfaces/container";
import { InjectionToken } from "../../src/interfaces/token";
import { ConditionalModule } from "../../src/modules/conditional-module";
import { ContainerModule as ContainerModuleImpl } from "../../src/modules/container-module";

// Define test tokens and services
const PROD_CONFIG_TOKEN = new InjectionToken<any>("ProductionConfig");
const DEV_CONFIG_TOKEN = new InjectionToken<any>("DevelopmentConfig");
const CONFIG_TOKEN = new InjectionToken<any>("Config");

// Sample configs
const prodConfig = {
  apiUrl: "https://api.example.com",
  isProd: true,
};

const devConfig = {
  apiUrl: "https://dev-api.example.com",
  isProd: false,
};

describe("Conditional Modules", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should load a module if the condition is true", () => {
    const isProd = true;

    const prodModule = new ContainerModuleImpl((container: Container) => {
      container.bind(PROD_CONFIG_TOKEN).toValue(prodConfig);
      container.bind(CONFIG_TOKEN).toValue(prodConfig);
    });

    const devModule = new ContainerModuleImpl((container: Container) => {
      container.bind(DEV_CONFIG_TOKEN).toValue(devConfig);
      container.bind(CONFIG_TOKEN).toValue(devConfig);
    });

    const conditionalModule = new ConditionalModule(
      () => isProd,
      (container: Container) => {
        prodModule.load(container);
      }
    );

    container.loadModule(conditionalModule);

    expect(container.isBound(PROD_CONFIG_TOKEN)).toBeTruthy();
    expect(container.isBound(CONFIG_TOKEN)).toBeTruthy();
    expect(container.resolve(CONFIG_TOKEN).isProd).toBe(true);
    expect(container.isBound(DEV_CONFIG_TOKEN)).toBeFalsy();
  });

  it("should load the alternative module if the condition is false", () => {
    const isProd = false;

    const prodModule = new ContainerModuleImpl((container: Container) => {
      container.bind(PROD_CONFIG_TOKEN).toValue(prodConfig);
      container.bind(CONFIG_TOKEN).toValue(prodConfig);
    });

    const devModule = new ContainerModuleImpl((container: Container) => {
      container.bind(DEV_CONFIG_TOKEN).toValue(devConfig);
      container.bind(CONFIG_TOKEN).toValue(devConfig);
    });

    const conditionalModule = new ConditionalModule(
      () => !isProd,
      (container: Container) => {
        devModule.load(container);
      }
    );

    container.loadModule(conditionalModule);

    expect(container.isBound(DEV_CONFIG_TOKEN)).toBeTruthy();
    expect(container.isBound(CONFIG_TOKEN)).toBeTruthy();
    expect(container.resolve(CONFIG_TOKEN).isProd).toBe(false);
    expect(container.isBound(PROD_CONFIG_TOKEN)).toBeFalsy();
  });

  it("should handle multiple conditional modules", () => {
    const featureFlags = {
      enableAuth: true,
      enableAnalytics: false,
    };

    const AUTH_TOKEN = new InjectionToken<string>("Auth");
    const ANALYTICS_TOKEN = new InjectionToken<string>("Analytics");

    const authConditional = new ConditionalModule(
      () => featureFlags.enableAuth,
      (container) => {
        container.bind(AUTH_TOKEN).toValue("auth-enabled");
      }
    );

    const analyticsConditional = new ConditionalModule(
      () => featureFlags.enableAnalytics,
      (container) => {
        container.bind(ANALYTICS_TOKEN).toValue("analytics-enabled");
      }
    );

    container.loadModules([authConditional, analyticsConditional]);

    expect(container.isBound(AUTH_TOKEN)).toBeTruthy();
    expect(container.isBound(ANALYTICS_TOKEN)).toBeFalsy();
  });
});
