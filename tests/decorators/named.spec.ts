import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import { Injectable } from "../../src/decorators/injectable";
import { Named } from "../../src/decorators/named";
import { InjectionToken } from "../../src/interfaces/token";
import { NAMED_DEPS_METADATA_KEY } from "../../src/utils/constants";
import { Inject } from "../../src/decorators/inject";

// Define test tokens and services
const DEFAULT_SERVICE = new InjectionToken<IService>("DefaultService");
const SPECIAL_SERVICE = new InjectionToken<IService>("SpecialService");

interface IService {
  getName(): string;
}

@Injectable()
class DefaultService implements IService {
  getName(): string {
    return "default";
  }
}

@Injectable()
class SpecialService implements IService {
  getName(): string {
    return "special";
  }
}

@Injectable()
class ServiceConsumer {
  constructor(
    @Inject("special") private specialService: IService,
    @Inject("default") private defaultService: IService
  ) {}

  getSpecialServiceName(): string {
    return this.specialService.getName();
  }

  getDefaultServiceName(): string {
    return this.defaultService.getName();
  }
}

// Class that explicitly tests the Named decorator
@Injectable()
class ServiceWithNamedDeps {
  constructor(
    @Named("special")
    @Inject(SPECIAL_SERVICE)
    private specialService: IService,

    @Named("default")
    @Inject(DEFAULT_SERVICE)
    private defaultService: IService
  ) {}

  getSpecialServiceName(): string {
    return this.specialService.getName();
  }

  getDefaultServiceName(): string {
    return this.defaultService.getName();
  }
}

describe("@Named Decorator", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
    container.bind(DEFAULT_SERVICE).toClass(DefaultService).inTransientScope();
    container.bind(SPECIAL_SERVICE).toClass(SpecialService).inTransientScope();
  });

  it("should store named parameter metadata correctly", () => {
    // Define a test class with the Named decorator
    class TestClass {
      constructor(@Named("test1") param1: any, @Named("test2") param2: any) {}
    }

    // Get the metadata directly
    const namedParams: Map<number, string> =
      Reflect.getMetadata(NAMED_DEPS_METADATA_KEY, TestClass) || new Map();

    expect(namedParams.size).toBe(2);
    expect(namedParams.get(0)).toBe("test1");
    expect(namedParams.get(1)).toBe("test2");
  });

  it("should correctly add names when decorators are applied multiple times", () => {
    // Define a test class with Named decorators applied in order
    class TestOrderClass {
      constructor(
        @Named("first") param1: any,
        @Named("second") param2: any,
        @Named("third") param3: any
      ) {}
    }

    // Get the metadata
    const namedParams: Map<number, string> =
      Reflect.getMetadata(NAMED_DEPS_METADATA_KEY, TestOrderClass) || new Map();

    expect(namedParams.size).toBe(3);
    expect(namedParams.get(0)).toBe("first");
    expect(namedParams.get(1)).toBe("second");
    expect(namedParams.get(2)).toBe("third");
  });

  it("should process decorators in the correct order", () => {
    // In TypeScript, decorators are applied bottom-to-top in the code,
    // but the implementation of @Named uses a Map.set which will overwrite
    // existing entries with the same key

    class TestOrderClass {
      constructor(
        @Named("original")
        @Named("override")
        param: any
      ) {}
    }

    // Get the metadata
    const namedParams: Map<number, string> =
      Reflect.getMetadata(NAMED_DEPS_METADATA_KEY, TestOrderClass) || new Map();

    // Named uses Map.set, so original will override the previous value
    expect(namedParams.get(0)).toBe("original");
  });

  it("should resolve dependencies based on named parameters", () => {
    // Set up bindings for named services
    container
      .bind("default")
      .toFactory(() => new DefaultService())
      .inTransientScope();
    container
      .bind("special")
      .toFactory(() => new SpecialService())
      .inTransientScope();
    container.bind(ServiceConsumer).toClass(ServiceConsumer).inTransientScope();

    const consumer = container.resolve(ServiceConsumer);

    expect(consumer.getDefaultServiceName()).toBe("default");
    expect(consumer.getSpecialServiceName()).toBe("special");
  });

  it("should work with direct @Named decorator usage", () => {
    const defaultService = container.resolve(DEFAULT_SERVICE);
    const specialService = container.resolve(SPECIAL_SERVICE);

    // First, set up bindings for the tokens
    container.bind(SPECIAL_SERVICE).toValue(specialService);
    container.bind(DEFAULT_SERVICE).toValue(defaultService);

    // Then create named mappings for the tokens
    const tokenToNamedMap = new Map<any, any>();
    tokenToNamedMap.set(`${SPECIAL_SERVICE}:special`, specialService);
    tokenToNamedMap.set(`${DEFAULT_SERVICE}:default`, defaultService);

    // Then bind those mappings to the container
    for (const [key, value] of tokenToNamedMap.entries()) {
      container.bind(key).toValue(value);
    }

    // Register the consumer that uses @Named
    container
      .bind(ServiceWithNamedDeps)
      .toClass(ServiceWithNamedDeps)
      .inTransientScope();

    const consumer = container.resolve(ServiceWithNamedDeps);

    expect(consumer.getDefaultServiceName()).toBe("default");
    expect(consumer.getSpecialServiceName()).toBe("special");
  });
});
