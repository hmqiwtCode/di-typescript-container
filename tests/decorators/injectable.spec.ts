import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import { Injectable } from "../../src/decorators/injectable";
import { Inject } from "../../src/decorators/inject";
import { InjectionToken } from "../../src/interfaces/token";
import {
  INJECTABLE_METADATA_KEY,
  PARAM_TYPES_METADATA_KEY,
} from "../../src/utils/constants";

// Tokens for testing
const CUSTOM_SERVICE_TOKEN = new InjectionToken<any>("CustomService");
const OPTIONAL_SERVICE_TOKEN = new InjectionToken<any>("OptionalService");

// Service with @Injectable decorator
@Injectable()
class TestService {
  getValue(): string {
    return "test-service";
  }
}

// Non-injectable service
class NonInjectableService {
  getValue(): string {
    return "non-injectable-service";
  }
}

// Service with constructor injection
@Injectable()
class ServiceWithDependency {
  constructor(private testService: TestService) {}

  getValue(): string {
    return `service-with-dependency: ${this.testService.getValue()}`;
  }
}

// Service with @Inject decorator
@Injectable()
class ServiceWithCustomInjection {
  constructor(@Inject(CUSTOM_SERVICE_TOKEN) private customService: any) {}

  getValue(): string {
    return `custom-injection: ${this.customService.getValue()}`;
  }
}

// Class for testing injectable metadata
class MetadataTestClass {}

// Class that depends on a non-injectable service
@Injectable()
class DependsOnNonInjectable {
  constructor(private service: NonInjectableService) {}
}

// Class for testing inject metadata
@Injectable()
class TargetClass {
  constructor(
    @Inject(CUSTOM_SERVICE_TOKEN) private param1: any,
    private param2: any
  ) {}
}

describe("Injectable Decorator", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should mark a class as injectable", () => {
    const decoratedClass = Injectable()(MetadataTestClass);

    const isInjectable = Reflect.getMetadata(
      INJECTABLE_METADATA_KEY,
      decoratedClass
    );
    expect(isInjectable).toBe(true);
  });

  it("should allow injection of an injectable class", () => {
    container.bind(TestService).toClass(TestService).inTransientScope();
    container
      .bind(ServiceWithDependency)
      .toClass(ServiceWithDependency)
      .inTransientScope();

    const instance = container.resolve(ServiceWithDependency);

    expect(instance).toBeInstanceOf(ServiceWithDependency);
    expect(instance.getValue()).toBe("service-with-dependency: test-service");
  });

  it("should throw when resolving a service that depends on a non-injectable class", () => {
    container
      .bind(DependsOnNonInjectable)
      .toClass(DependsOnNonInjectable)
      .inTransientScope();

    expect(() => container.resolve(DependsOnNonInjectable)).toThrow();
  });
});

describe("Inject Decorator", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should inject a custom token", () => {
    const customService = {
      getValue: () => "custom-service",
    };

    container.bind(CUSTOM_SERVICE_TOKEN).toValue(customService);
    container
      .bind(ServiceWithCustomInjection)
      .toClass(ServiceWithCustomInjection)
      .inTransientScope();

    const instance = container.resolve(ServiceWithCustomInjection);

    expect(instance.getValue()).toBe("custom-injection: custom-service");
  });

  it("should store custom injection tokens in metadata", () => {
    const metadata = Reflect.getOwnMetadata(
      PARAM_TYPES_METADATA_KEY,
      TargetClass
    );

    expect(metadata).toBeDefined();
    expect(metadata[0]).toBe(CUSTOM_SERVICE_TOKEN);
    expect(metadata[1]).toBeUndefined(); // No explicit token for param2
  });
});
