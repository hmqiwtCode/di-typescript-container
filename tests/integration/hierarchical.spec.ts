import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import { InjectionToken } from "../../src/interfaces/token";
import { Injectable } from "../../src/decorators/injectable";
import { Inject } from "../../src/decorators/inject";

// Define tokens for different scopes
const ROOT_TOKEN = new InjectionToken<string>("root");
const SHARED_TOKEN = new InjectionToken<string>("shared");
const CHILD_TOKEN = new InjectionToken<string>("child");
const GRANDCHILD_TOKEN = new InjectionToken<string>("grandchild");

const LOGGER_TOKEN = new InjectionToken<Logger>("Logger");
interface Logger {
  log(message: string): string;
}

@Injectable()
class RootLogger implements Logger {
  log(message: string): string {
    return `[ROOT] ${message}`;
  }
}

@Injectable()
class ChildLogger implements Logger {
  log(message: string): string {
    return `[CHILD] ${message}`;
  }
}

@Injectable()
class Service {
  constructor(@Inject(LOGGER_TOKEN) private logger: Logger) {}

  doSomething(input: string): string {
    return this.logger.log(input);
  }
}

@Injectable()
class ServiceWithLogger {
  constructor(@Inject(LOGGER_TOKEN) private logger: Logger) {}

  doSomething(input: string): string {
    return this.logger.log(input);
  }
}

describe("Hierarchical Containers", () => {
  let rootContainer: Container;
  let childContainer: Container;
  let grandchildContainer: Container;

  beforeEach(() => {
    rootContainer = new DIContainer();
    childContainer = rootContainer.createChildContainer();
    grandchildContainer = childContainer.createChildContainer();

    rootContainer.bind(ROOT_TOKEN).toValue("root-value");
    rootContainer.bind(SHARED_TOKEN).toValue("shared-from-root");
    rootContainer.bind(LOGGER_TOKEN).toClass(RootLogger).inSingletonScope();
  });

  it("should resolve from parent when not found in child", () => {
    const rootValue = childContainer.resolve(ROOT_TOKEN);

    expect(rootValue).toBe("root-value");
  });

  it("should override parent bindings in child", () => {
    childContainer.bind(SHARED_TOKEN).toValue("shared-from-child");

    const rootSharedValue = rootContainer.resolve(SHARED_TOKEN);
    const childSharedValue = childContainer.resolve(SHARED_TOKEN);

    expect(rootSharedValue).toBe("shared-from-root");
    expect(childSharedValue).toBe("shared-from-child");
  });

  it("should keep separate instances in different containers when using transient scope", () => {
    const SERVICE_TOKEN = new InjectionToken<any>("Service");
    rootContainer.bind(SERVICE_TOKEN).toValue({ id: "root-service" });
    childContainer.bind(SERVICE_TOKEN).toValue({ id: "child-service" });

    const rootService = rootContainer.resolve(SERVICE_TOKEN);
    const childService = childContainer.resolve(SERVICE_TOKEN);

    expect(rootService).not.toBe(childService);
    expect(rootService.id).toBe("root-service");
    expect(childService.id).toBe("child-service");
  });

  it("should properly resolve dependencies in multi-level container hierarchy", () => {
    childContainer.bind(LOGGER_TOKEN).toClass(ChildLogger).inSingletonScope();
    childContainer.bind(CHILD_TOKEN).toValue("child-value");
    grandchildContainer.bind(GRANDCHILD_TOKEN).toValue("grandchild-value");
    expect(rootContainer.resolve(ROOT_TOKEN)).toBe("root-value");
    expect(rootContainer.resolve(SHARED_TOKEN)).toBe("shared-from-root");
    expect(() => rootContainer.resolve(CHILD_TOKEN)).toThrow();
    expect(() => rootContainer.resolve(GRANDCHILD_TOKEN)).toThrow();
    expect(childContainer.resolve(ROOT_TOKEN)).toBe("root-value");
    expect(childContainer.resolve(CHILD_TOKEN)).toBe("child-value");
    expect(() => childContainer.resolve(GRANDCHILD_TOKEN)).toThrow();
    expect(grandchildContainer.resolve(ROOT_TOKEN)).toBe("root-value");
    expect(grandchildContainer.resolve(CHILD_TOKEN)).toBe("child-value");
    expect(grandchildContainer.resolve(GRANDCHILD_TOKEN)).toBe(
      "grandchild-value"
    );
  });

  it("should use closest defined binding in hierarchy", () => {
    const ROOT_SERVICE_TOKEN = new InjectionToken<any>("RootService");
    const CHILD_SERVICE_TOKEN = new InjectionToken<any>("ChildService");

    const rootLogger = rootContainer.resolve(LOGGER_TOKEN);
    const rootService = {
      log: (msg: string) => rootLogger.log(msg),
    };

    childContainer.bind(LOGGER_TOKEN).toClass(ChildLogger).inSingletonScope();
    const childLogger = childContainer.resolve(LOGGER_TOKEN);
    const childService = {
      log: (msg: string) => childLogger.log(msg),
    };

    rootContainer.bind(ROOT_SERVICE_TOKEN).toValue(rootService);
    childContainer.bind(CHILD_SERVICE_TOKEN).toValue(childService);

    const resolvedRootService = rootContainer.resolve(ROOT_SERVICE_TOKEN);
    const resolvedChildService = childContainer.resolve(CHILD_SERVICE_TOKEN);

    expect(resolvedRootService.log("test")).toBe("[ROOT] test");
    expect(resolvedChildService.log("test")).toBe("[CHILD] test");
  });
});
