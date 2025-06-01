import { Constructor } from "../../interfaces/token";
import { Container } from "../../interfaces/container";
import { MetadataReader } from "../../utils/metadata";

/**
 * Handles property/setter injection
 */
export class PropertyInjector {
  constructor(private container: Container) {}

  /**
   * Perform property injections for an instance
   */
  injectProperties<T>(ctor: Constructor<T>, instance: T): void {
    const propertyInjections = MetadataReader.getPropertyInjections(ctor);

    for (const injection of propertyInjections) {
      try {
        const dependency = this.container.resolve(injection.token);
        (instance as any)[injection.propertyKey] = dependency;
      } catch (error: any) {
        throw new Error(
          `Error performing property injection for ${injection.propertyKey.toString()} in ${
            ctor.name
          }: ${error.message}`
        );
      }
    }
  }
}
