import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { Injectable } from "../../../src/decorators/injectable";
import { InjectionToken } from "../../../src/interfaces/token";

// Define test tokens and classes
const PARENT_TOKEN = new InjectionToken<string>("ParentToken");
const CHILD_TOKEN = new InjectionToken<string>("ChildToken");
const OVERRIDE_TOKEN = new InjectionToken<string>("OverrideToken");

@Injectable()
class ParentService {
  getValue(): string {
    return "parent-service";
  }
}

@Injectable()
class ChildService {
  getValue(): string {
    return "child-service";
  }
}

describe("Child Container", () => {
  let parentContainer: Container;
  let childContainer: Container;

  beforeEach(() => {
    // Create parent container with some bindings
    parentContainer = new DIContainer();
    parentContainer.bind(PARENT_TOKEN).toValue("parent-value");
    parentContainer.bind(OVERRIDE_TOKEN).toValue("parent-override");
    parentContainer
      .bind(ParentService)
      .toClass(ParentService)
      .inSingletonScope();

    // Create child container
    childContainer = parentContainer.createChildContainer();

    // Add child-specific bindings
    childContainer.bind(CHILD_TOKEN).toValue("child-value");
    childContainer.bind(ChildService).toClass(ChildService).inTransientScope();
  });

  it("should have a reference to its parent", () => {
    expect(childContainer.getParent()).toBe(parentContainer);
    expect(parentContainer.getParent()).toBeNull();
  });

  it("should resolve bindings from parent container", () => {
    expect(childContainer.resolve(PARENT_TOKEN)).toBe("parent-value");
    expect(childContainer.resolve(ParentService)).toBeInstanceOf(ParentService);
  });

  it("should resolve its own bindings", () => {
    expect(childContainer.resolve(CHILD_TOKEN)).toBe("child-value");
    expect(childContainer.resolve(ChildService)).toBeInstanceOf(ChildService);
  });

  it("should allow overriding parent bindings", () => {
    childContainer.bind(OVERRIDE_TOKEN).toValue("child-override");
    expect(childContainer.resolve(OVERRIDE_TOKEN)).toBe("child-override");
    expect(parentContainer.resolve(OVERRIDE_TOKEN)).toBe("parent-override");
  });

  it("should check if a token is bound in itself or parent", () => {
    expect(childContainer.isBound(PARENT_TOKEN)).toBe(true);
    expect(childContainer.isBound(CHILD_TOKEN)).toBe(true);
    expect(parentContainer.isBound(CHILD_TOKEN)).toBe(false);
  });

  it("should not affect parent when unbinding tokens", () => {
    childContainer.bind(OVERRIDE_TOKEN).toValue("child-override");

    childContainer.unbind(OVERRIDE_TOKEN);

    expect(childContainer.resolve(OVERRIDE_TOKEN)).toBe("parent-override");
    expect(parentContainer.resolve(OVERRIDE_TOKEN)).toBe("parent-override");
  });

  it("should create a proper hierarchy of containers", () => {
    const grandchildContainer = childContainer.createChildContainer();
    grandchildContainer.bind(OVERRIDE_TOKEN).toValue("grandchild-override");
    expect(grandchildContainer.getParent()).toBe(childContainer);
    expect(grandchildContainer.resolve(PARENT_TOKEN)).toBe("parent-value");
    expect(grandchildContainer.resolve(CHILD_TOKEN)).toBe("child-value");
    expect(grandchildContainer.resolve(OVERRIDE_TOKEN)).toBe(
      "grandchild-override"
    );
  });
});
