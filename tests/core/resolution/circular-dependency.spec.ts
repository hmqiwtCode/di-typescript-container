import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectionToken } from "../../../src/interfaces/token";
import { CircularDependencyHandler } from "../../../src/core/resolution/circular-dependency-handler";

// Interface for circular dependency testing
interface IServiceA {
  getValueA(): string;
}

interface IServiceB {
  getValueB(): string;
}

// Services with circular dependency
@Injectable()
class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {}

  getValueA(): string {
    return "ServiceA: " + this.serviceB.getValueB();
  }
}

@Injectable()
class ServiceB implements IServiceB {
  constructor(private serviceA: IServiceA) {}

  getValueB(): string {
    return "ServiceB calls " + this.serviceA;
  }
}

// Define tokens for circular dependency testing
const SERVICE_A_TOKEN = new InjectionToken<any>("ServiceA");
const SERVICE_B_TOKEN = new InjectionToken<any>("ServiceB");

// Test directly with the CircularDependencyHandler
describe("CircularDependencyHandler", () => {
  let handler: CircularDependencyHandler;

  beforeEach(() => {
    handler = new CircularDependencyHandler();
  });

  it("should detect circular dependencies", () => {
    
    handler.enterResolution(SERVICE_A_TOKEN);
    expect(() => handler.checkCycle(SERVICE_A_TOKEN)).toThrow(
      /circular dependency/i
    );
  });

  it("should track resolution stack correctly", () => {
    
    handler.enterResolution(SERVICE_A_TOKEN);
    expect(handler.isResolving(SERVICE_A_TOKEN)).toBeTruthy();
    expect(handler.isResolving(SERVICE_B_TOKEN)).toBeFalsy();

    // Cleanup
    handler.exitResolution(SERVICE_A_TOKEN);
    expect(handler.isResolving(SERVICE_A_TOKEN)).toBeFalsy();
  });
});

// Self-circular dependency
@Injectable()
class SelfCircularService {
  constructor(private self: SelfCircularService) {}
}

describe("Container Circular Dependencies", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should detect self circular dependencies", () => {
    
    container
      .bind(SelfCircularService)
      .toClass(SelfCircularService)
      .inTransientScope();
    expect(() => container.resolve(SelfCircularService)).toThrow();
  });
});
