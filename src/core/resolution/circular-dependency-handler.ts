import { Token } from "../../interfaces/token";

/**
 * Handles circular dependency detection
 */
export class CircularDependencyHandler {
  private resolutionStack = new Set<Token<any>>();

  /**
   * Check if the token is already in resolution stack
   */
  checkCycle(token: Token<any>): void {
    if (this.resolutionStack.has(token)) {
      throw new Error(
        `Circular dependency detected while resolving ${token.toString()}`
      );
    }
  }

  /**
   * Add token to resolution stack
   */
  enterResolution(token: Token<any>): void {
    this.resolutionStack.add(token);
  }

  /**
   * Remove token from resolution stack
   */
  exitResolution(token: Token<any>): void {
    this.resolutionStack.delete(token);
  }

  /**
   * Check if we're currently resolving a token
   */
  isResolving(token: Token<any>): boolean {
    return this.resolutionStack.has(token);
  }
}
