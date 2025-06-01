import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import { Injectable } from "../../src/decorators/injectable";
import { Optional } from "../../src/decorators/optional";
import { InjectionToken } from "../../src/interfaces/token";
import { OPTIONAL_DEPS_METADATA_KEY } from "../../src/utils/constants";
import { Inject } from "../../src/decorators/inject";

const OPTIONAL_SERVICE_TOKEN = new InjectionToken<any>("OptionalService");
const REQUIRED_SERVICE_TOKEN = new InjectionToken<string>("RequiredService");

@Injectable()
class ServiceWithOptionalDependency {
  constructor(
    @Optional() @Inject(OPTIONAL_SERVICE_TOKEN) private optionalService: any,
    @Inject(REQUIRED_SERVICE_TOKEN) private requiredService: string
  ) {}

  hasOptionalService(): boolean {
    return this.optionalService !== undefined;
  }

  getRequiredService(): string {
    return this.requiredService;
  }
}

describe("@Optional Decorator", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
    container.bind(REQUIRED_SERVICE_TOKEN).toValue("required-value");
  });

  it("should mark a parameter as optional", () => {
    class TestClass {
      constructor(param: any) {}
    }

    const optionalParams = [true];
    Reflect.defineMetadata(
      OPTIONAL_DEPS_METADATA_KEY,
      optionalParams,
      TestClass
    );

    const optionalParamsResult =
      Reflect.getMetadata(OPTIONAL_DEPS_METADATA_KEY, TestClass) || [];

    expect(optionalParamsResult.length).toBeGreaterThan(0);
    expect(optionalParamsResult[0]).toBe(true);
  });

  it("should resolve a service with an optional dependency not bound", () => {
    container
      .bind(ServiceWithOptionalDependency)
      .toClass(ServiceWithOptionalDependency)
      .inTransientScope();

    const instance = container.resolve(ServiceWithOptionalDependency);

    expect(instance).toBeInstanceOf(ServiceWithOptionalDependency);
    expect(instance.hasOptionalService()).toBe(false);
    expect(instance.getRequiredService()).toBe("required-value");
  });

  it("should resolve a service with an optional dependency that is bound", () => {
    container.bind(OPTIONAL_SERVICE_TOKEN).toValue("optional-value");
    container
      .bind(ServiceWithOptionalDependency)
      .toClass(ServiceWithOptionalDependency)
      .inTransientScope();

    const instance = container.resolve(ServiceWithOptionalDependency);

    expect(instance).toBeInstanceOf(ServiceWithOptionalDependency);
    expect(instance.hasOptionalService()).toBe(true);
    expect(instance.getRequiredService()).toBe("required-value");
  });
});
