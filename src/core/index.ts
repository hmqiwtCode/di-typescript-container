// Export the container implementation
export { DIContainer, DIContainerOptions } from "./container/container";

// Export binding components
export { BindingManager } from "./binding/binding-manager";
export { BindingBuilderImpl } from "./binding/binding-builder";
export { ScopeBuilderImpl } from "./binding/scope-builder";

// Export resolution components
export { DependencyResolver } from "./resolution/resolver";
export { PropertyInjector } from "./resolution/property-injector";
export { InstanceCreator } from "./resolution/instance-creator";
export { CircularDependencyHandler } from "./resolution/circular-dependency-handler";

// Export module components
export { ModuleLoader } from "./module/module-loader";
export { AsyncModuleLoader } from "./module/async-module-loader";
