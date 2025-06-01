import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import { Injectable } from "../../src/decorators/injectable";
import {
  Intercept,
  INTERCEPTORS_METADATA_KEY,
} from "../../src/decorators/intercept";
import { InjectionToken } from "../../src/interfaces/token";
import {
  Interceptor,
  InvocationContext,
} from "../../src/interfaces/interceptor";

// Define test interceptors
@Injectable()
class LoggingInterceptor implements Interceptor {
  intercept(context: InvocationContext, next: () => any): any {
    const result = next(); // Call the original method
    return `LOG: ${result}`;
  }
}

@Injectable()
class CachingInterceptor implements Interceptor {
  private cache = new Map<string, any>();

  intercept(context: InvocationContext, next: () => any): any {
    const key = `${String(context.methodName)}:${JSON.stringify(context.args)}`;

    if (this.cache.has(key)) {
      return `CACHED: ${this.cache.get(key)}`;
    }

    const result = next(); // Call the original method
    this.cache.set(key, result);
    return result;
  }
}

// Define test service with methods that are actually intercepted using the decorator
@Injectable()
class TestServiceWithDecorator {
  // We don't need to inject container for our tests
  constructor() {}

  container: Container | null = null; // Will be set in tests

  @Intercept(new LoggingInterceptor())
  getMessage(name: string): string {
    return `Hello, ${name}!`;
  }

  @Intercept(new CachingInterceptor())
  computeValue(input: number): number {
    // This would be an expensive computation
    return input * 2;
  }

  @Intercept(new LoggingInterceptor(), new CachingInterceptor())
  getComplexValue(input: string): string {
    return `Complex(${input})`;
  }
}

// Define test service without decorators for manual interception tests
@Injectable()
class TestService {
  getMessage(name: string): string {
    return `Hello, ${name}!`;
  }

  computeValue(input: number): number {
    return input * 2;
  }

  getComplexValue(input: string): string {
    return `Complex(${input})`;
  }
}

describe("Interceptor Pattern", () => {
  let container: Container;
  let service: TestService;
  let decoratedService: TestServiceWithDecorator;
  let loggingInterceptor: LoggingInterceptor;
  let cachingInterceptor: CachingInterceptor;

  beforeEach(() => {
    container = new DIContainer();

    // Register the interceptors
    container
      .bind(LoggingInterceptor)
      .toClass(LoggingInterceptor)
      .inSingletonScope();
    container
      .bind(CachingInterceptor)
      .toClass(CachingInterceptor)
      .inSingletonScope();

    // Register the services
    container.bind(TestService).toClass(TestService).inTransientScope();
    container
      .bind(TestServiceWithDecorator)
      .toClass(TestServiceWithDecorator)
      .inTransientScope();

    service = container.resolve(TestService);
    decoratedService = container.resolve(TestServiceWithDecorator);

    // Set container reference for the decorated service
    decoratedService.container = container;

    // Get the interceptors
    loggingInterceptor = container.resolve(LoggingInterceptor);
    cachingInterceptor = container.resolve(CachingInterceptor);
  });

  it("should store interceptor metadata when using @Intercept decorator", () => {
    // Check if the metadata is stored correctly
    const interceptors = Reflect.getMetadata(
      INTERCEPTORS_METADATA_KEY,
      TestServiceWithDecorator.prototype,
      "getMessage"
    );

    expect(interceptors).toBeDefined();
    expect(interceptors.length).toBe(1);
    expect(interceptors[0]).toBeInstanceOf(LoggingInterceptor);
  });

  it("should apply the interceptor when method is called using @Intercept", () => {
    // Call the decorated method
    const result = decoratedService.getMessage("John");

    expect(result).toContain("LOG:");
    expect(result).toContain("Hello, John!");
  });

  it("should apply caching interceptor when decorated method is called multiple times", () => {
    // Call the decorated method twice
    decoratedService.computeValue(5);
    const result = decoratedService.computeValue(5);

    expect(result).toContain("CACHED:");
  });

  it("should apply multiple interceptors in the correct order when using @Intercept", () => {
    // The method is decorated with LoggingInterceptor followed by CachingInterceptor
    const result = decoratedService.getComplexValue("test");

    expect(result).toContain("LOG:");

    const cachedResult = decoratedService.getComplexValue("test");
    expect(cachedResult).toContain("LOG:");
    expect(cachedResult).toContain("CACHED:");
  });

  it("should handle no interceptors and call original method", () => {
    // Create a dynamic test class with a method that uses empty interceptors array
    class EmptyInterceptTest {
      @Intercept()
      testMethod(): string {
        return "original";
      }
    }

    const instance = new EmptyInterceptTest();
    const result = instance.testMethod();

    expect(result).toBe("original");
  });

  // Original manual interception tests
  it("should wrap method with logging interceptor", () => {
    const context: InvocationContext = {
      target: service,
      methodName: "getMessage",
      args: ["John"],
      container: container,
      proceed: () => service.getMessage("John"),
    };

    const result = loggingInterceptor.intercept(context, context.proceed);

    expect(result).toContain("LOG:");
    expect(result).toContain("Hello, John!");
  });

  it("should wrap method with caching interceptor", () => {
    const context: InvocationContext = {
      target: service,
      methodName: "computeValue",
      args: [5],
      container: container,
      proceed: () => service.computeValue(5),
    };

    const result1 = cachingInterceptor.intercept(context, context.proceed);
    const result2 = cachingInterceptor.intercept(context, context.proceed);

    expect(result2).toContain("CACHED:");
  });

  it("should apply multiple interceptors in the correct order", () => {
    const context: InvocationContext = {
      target: service,
      methodName: "getComplexValue",
      args: ["test"],
      container: container,
      proceed: () => service.getComplexValue("test"),
    };

    // Apply logging interceptor, which in turn calls caching interceptor
    const wrappedProceed = () =>
      cachingInterceptor.intercept(context, context.proceed);
    const result = loggingInterceptor.intercept(context, wrappedProceed);

    expect(result).toContain("LOG:");
  });
});
