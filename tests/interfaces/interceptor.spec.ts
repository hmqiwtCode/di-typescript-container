import "reflect-metadata";
import { DIContainer } from "../../src/core/container/container";
import { Container } from "../../src/interfaces/container";
import {
  Interceptor,
  InvocationContext,
  INTERCEPTORS,
} from "../../src/interfaces/interceptor";
import { Injectable } from "../../src/decorators/injectable";

// Implement a complete interceptor that uses all interface methods
@Injectable()
class CompleteInterceptor implements Interceptor {
  public beforeCalled = false;
  public interceptCalled = false;
  public afterCalled = false;

  beforeInvocation(context: InvocationContext): boolean {
    this.beforeCalled = true;
    // Check if the arguments contain a specific value to cancel
    return !context.args.includes("cancel");
  }

  intercept(context: InvocationContext, next: () => any): any {
    this.interceptCalled = true;
    // Modify arguments before proceeding
    if (context.args.includes("modify")) {
      context.args[context.args.indexOf("modify")] = "modified";
    }
    return next();
  }

  afterInvocation(context: InvocationContext, returnValue: any): any {
    this.afterCalled = true;
    // Modify return value if requested
    if (context.args.includes("transform")) {
      return `transformed(${returnValue})`;
    }
    return returnValue;
  }
}

// Test target service
@Injectable()
class TargetService {
  processMessage(...args: any[]): string {
    return `Processed: ${args.join(", ")}`;
  }
}

describe("Interceptor Interface", () => {
  let container: Container;
  let interceptor: CompleteInterceptor;
  let targetService: TargetService;

  beforeEach(() => {
    container = new DIContainer();
    container
      .bind(CompleteInterceptor)
      .toClass(CompleteInterceptor)
      .inTransientScope();
    container.bind(TargetService).toClass(TargetService).inTransientScope();

    interceptor = container.resolve(CompleteInterceptor);
    targetService = container.resolve(TargetService);
  });

  it("should define the INTERCEPTORS token", () => {
    expect(INTERCEPTORS).toBeDefined();
    expect(INTERCEPTORS.toString()).toContain("Interceptors");
  });

  it("should call beforeInvocation and allow execution", () => {
    const context: InvocationContext = {
      target: targetService,
      methodName: "processMessage",
      args: ["test"],
      container,
      proceed: () => targetService.processMessage("test"),
    };

    const beforeResult = interceptor.beforeInvocation?.(context);
    const result = interceptor.intercept(context, context.proceed);

    expect(beforeResult).toBe(true);
    expect(interceptor.beforeCalled).toBe(true);
    expect(result).toBe("Processed: test");
  });

  it("should cancel execution when beforeInvocation returns false", () => {
    const context: InvocationContext = {
      target: targetService,
      methodName: "processMessage",
      args: ["cancel"],
      container,
      proceed: () => targetService.processMessage("cancel"),
    };

    const beforeResult = interceptor.beforeInvocation?.(context);

    expect(beforeResult).toBe(false);
    expect(interceptor.beforeCalled).toBe(true);
  });

  it("should modify arguments in intercept method", () => {
    const context: InvocationContext = {
      target: targetService,
      methodName: "processMessage",
      args: ["modify"],
      container,
      proceed: () => targetService.processMessage(...context.args),
    };

    const result = interceptor.intercept(context, context.proceed);

    expect(interceptor.interceptCalled).toBe(true);
    expect(result).toBe("Processed: modified");
  });

  it("should transform return value in afterInvocation", () => {
    const context: InvocationContext = {
      target: targetService,
      methodName: "processMessage",
      args: ["transform"],
      container,
      proceed: () => targetService.processMessage(...context.args),
    };

    const initialResult = interceptor.intercept(context, context.proceed);
    const finalResult = interceptor.afterInvocation?.(context, initialResult);

    expect(interceptor.afterCalled).toBe(true);
    expect(finalResult).toBe("transformed(Processed: transform)");
  });

  it("should execute a complete interception flow", () => {
    const context: InvocationContext = {
      target: targetService,
      methodName: "processMessage",
      args: ["modify", "transform"],
      container,
      proceed: () => targetService.processMessage(...context.args),
    };

    const beforeResult = interceptor.beforeInvocation?.(context);
    let result;

    if (beforeResult !== false) {
      result = interceptor.intercept(context, context.proceed);
      result = interceptor.afterInvocation?.(context, result);
    }

    expect(interceptor.beforeCalled).toBe(true);
    expect(interceptor.interceptCalled).toBe(true);
    expect(interceptor.afterCalled).toBe(true);
    expect(result).toBe("transformed(Processed: modified, transform)");
  });
});
