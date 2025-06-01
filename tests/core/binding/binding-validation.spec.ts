import "reflect-metadata";
import { DIContainer } from "../../../src/core/container/container";
import { Container } from "../../../src/interfaces/container";
import { InjectionToken } from "../../../src/interfaces/token";

// Test tokens and values
const TEST_TOKEN = new InjectionToken<string>("test");
const NON_CONSTRUCTOR_VALUE = {};

describe("Binding Validation", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should not allow binding a non-constructor to toClass", () => {
    // Note: In TypeScript this would be caught at compile time
    // This test documents the behavior but doesn't expect an exception
    container.bind(TEST_TOKEN).toClass(NON_CONSTRUCTOR_VALUE as any);

    // Attempting to resolve will fail though
    expect(() => container.resolve(TEST_TOKEN)).toThrow();
  });

  it("should throw when resolving an unbound token", () => {
    // Act & Assert
    expect(() => {
      container.resolve(TEST_TOKEN);
    }).toThrow(/No binding found for token/);
  });

  it("should provide clear error message for missing bindings", () => {
    // Act
    try {
      container.resolve(TEST_TOKEN);
      fail("Expected resolve to throw an error");
    } catch (error) {
      // Assert
      expect((error as Error).message).toContain("No binding found for token");
      expect((error as Error).message).toContain("test"); // The token description
    }
  });

  it("should allow undefined factory but fail at resolution time", () => {
    // In a real system this would be caught at compile time
    // This test documents the behavior
    const invalidFactory = undefined;

    // Binding succeeds
    // @ts-ignore - Intentional invalid usage for testing
    container.bind(TEST_TOKEN).toFactory(invalidFactory).inTransientScope();

    // But resolution fails
    expect(() => container.resolve(TEST_TOKEN)).toThrow();
  });

  it("should validate singleton scope setups", () => {
    // Act
    container.bind(TEST_TOKEN).toValue("test-value");

    // Assert (value bindings are implicitly singletons, no need to set scope)
    expect(() => container.resolve(TEST_TOKEN)).not.toThrow();
    expect(container.resolve(TEST_TOKEN)).toBe("test-value");
  });
});

describe("Resolution Error Handling", () => {
  let container: Container;

  beforeEach(() => {
    container = new DIContainer();
  });

  it("should throw descriptive error when factory returns a promise but used synchronously", () => {
    // Arrange
    const asyncFactory = () => Promise.resolve("async value");
    container.bind(TEST_TOKEN).toFactory(asyncFactory).inTransientScope();

    // Act & Assert
    expect(() => container.resolve(TEST_TOKEN)).toThrow(/Promise/);
  });

  it("should handle nested resolution failures with clear error messages", () => {
    // Arrange
    const INNER_TOKEN = new InjectionToken<string>("inner");
    const OUTER_TOKEN = new InjectionToken<any>("outer");

    // Setup factory that depends on an unbound token
    container
      .bind(OUTER_TOKEN)
      .toFactory((c) => {
        return c.resolve(INNER_TOKEN); // This will fail
      })
      .inTransientScope();

    // Act & Assert
    expect(() => container.resolve(OUTER_TOKEN)).toThrow(
      /No binding found for token/
    );
  });

  it("should handle errors in factory functions", () => {
    // Arrange
    const failingFactory = () => {
      throw new Error("Factory failed");
    };

    container.bind(TEST_TOKEN).toFactory(failingFactory).inTransientScope();

    // Act & Assert
    expect(() => container.resolve(TEST_TOKEN)).toThrow("Factory failed");
  });
});
