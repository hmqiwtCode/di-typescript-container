# DI Container Examples

This directory contains examples demonstrating how to use the DI container.

## Basic Example

The basic example (`basic/example.ts`) shows:

- Creating a container
- Registering services with different binding types
- Using decorators (@Injectable, @Inject, @Optional, @Named)
- Resolving and using services

To run the example:

```bash
npx ts-node examples/basic/example.ts
```

## Module Example

The module example (`modules/module-example.ts`) demonstrates the module system:

- Using the module system to organize bindings
- Conditional modules that load based on environment
- Asynchronous modules for loading configuration

To run the example:

```bash
npx ts-node examples/modules/module-example.ts
```

## Hierarchical Container Example

The hierarchical example (`hierarchical/hierarchical-example.ts`) shows:

- Creating parent and child containers
- Overriding bindings in child containers
- Resolving dependencies across container hierarchies

To run the example:

```bash
npx ts-node examples/hierarchical/hierarchical-example.ts
```

## Circular Dependencies Example

The circular dependencies example (`circular-dependencies/circular-example.ts`) demonstrates:

- Handling circular dependencies with lazy injection
- Using property injection to break dependency cycles
- How the container automatically detects and resolves circular dependencies

To run the example:

```bash
npx ts-node examples/circular-dependencies/circular-example.ts
```

## Interceptors Example

The interceptors example (`interceptors/interceptor-example.ts`) shows:

- Creating and applying method interceptors
- Implementing cross-cutting concerns (logging, caching)
- Using the AOP (Aspect-Oriented Programming) capabilities

To run the example:

```bash
npx ts-node examples/interceptors/interceptor-example.ts
```

## Real-World Application Example

The real-world example (`real-world/real-world-example.ts`) demonstrates:

- Building a more complex application with multiple services
- Implementing a layered architecture (repository, service, etc.)
- Using dependency injection in an async/await environment
- Working with tokens for interface-based injection

To run the example:

```bash
npx ts-node examples/real-world/real-world-example.ts
```

## Notes on Examples

The examples should be run from the root directory of the project, as they use relative imports to the main library code.

To make the examples work with decorators, you'll need to set the proper TypeScript configuration options:

```json
{
  "experimentalDecorators": true,
  "emitDecoratorMetadata": true
}
```

These options are already set in the main `tsconfig.json` file.

# Auto-Injection Examples

This section covers examples demonstrating the auto-injection feature of the DI container.

## Basic Auto-Injection

The basic auto-injection pattern demonstrates how classes marked with `@Injectable` are automatically registered in the container without explicit binding statements:

```typescript
import { Injectable, DIContainer } from "../src";

@Injectable()
class SimpleService {
  getName(): string {
    return "SimpleService";
  }
}

@Injectable()
class DependentService {
  constructor(private simpleService: SimpleService) {}

  getServiceName(): string {
    return `Using ${this.simpleService.getName()}`;
  }
}

// Create container with auto-resolution enabled (default)
const container = new DIContainer();

// Resolve DependentService without explicit registration
const dependentService = container.resolve(DependentService);
console.log(dependentService.getServiceName()); // "Using SimpleService"
```

## Token-Based Auto-Injection

The token-based auto-injection pattern allows you to register implementations for interfaces using tokens:

```typescript
import { Injectable, Inject, InjectionToken, DIContainer } from "../src";

// Define an interface
interface UserService {
  getUsers(): string[];
}

// Create a token for the interface
const USER_SERVICE = new InjectionToken<UserService>("UserService");

// Register the implementation with the token
@Injectable(USER_SERVICE)
class UserServiceImpl implements UserService {
  getUsers(): string[] {
    return ["Alice", "Bob", "Charlie"];
  }
}

// Inject the implementation using the token
@Injectable()
class AppService {
  constructor(@Inject(USER_SERVICE) private userService: UserService) {}

  getGreeting(): string {
    return `Hello ${this.userService.getUsers().join(", ")}!`;
  }
}

// Create container with auto-resolution
const container = new DIContainer();

// Resolve without explicit binding statements
const app = container.resolve(AppService);
console.log(app.getGreeting()); // "Hello Alice, Bob, Charlie!"
```

## Auto-Injection with Circular Dependencies

For circular dependencies, you can use a combination of token-based auto-injection and lazy loading:

```typescript
import { Injectable, Inject, Lazy, InjectionToken, DIContainer } from "../src";

// Define interfaces
interface ServiceA {
  getName(): string;
  callServiceB(): string;
}

interface ServiceB {
  getName(): string;
  callServiceA(): string;
}

// Define tokens for our interfaces
const SERVICE_A_TOKEN = new InjectionToken<ServiceA>("ServiceA");
const SERVICE_B_TOKEN = new InjectionToken<ServiceB>("ServiceB");

// Implement circular dependencies with auto-injection
@Injectable(SERVICE_A_TOKEN)
class ServiceAImpl implements ServiceA {
  constructor(
    @Lazy(SERVICE_B_TOKEN) @Inject(SERVICE_B_TOKEN) private serviceB: ServiceB
  ) {}

  getName(): string {
    return "ServiceA";
  }

  callServiceB(): string {
    return `ServiceA -> ${this.serviceB.getName()}`;
  }
}

@Injectable(SERVICE_B_TOKEN)
class ServiceBImpl implements ServiceB {
  constructor(
    @Lazy(SERVICE_A_TOKEN) @Inject(SERVICE_A_TOKEN) private serviceA: ServiceA
  ) {}

  getName(): string {
    return "ServiceB";
  }

  callServiceA(): string {
    return `ServiceB -> ${this.serviceA.getName()}`;
  }
}

// Create container with auto-resolution
const container = new DIContainer({ autoResolve: true });

// Resolve ServiceA without explicit binding statements
const serviceA = container.resolve<ServiceA>(SERVICE_A_TOKEN);
console.log(serviceA.callServiceB()); // "ServiceA -> ServiceB"

// Verify circular dependency works
const serviceB = container.resolve<ServiceB>(SERVICE_B_TOKEN);
console.log(serviceB.callServiceA()); // "ServiceB -> ServiceA"
```

## Configuration Options

You can configure auto-injection behavior:

```typescript
// Create container with specific options
const container = new DIContainer({
  autoResolve: true, // Enable auto-resolution (default)
  defaultScope: BindingScope.Singleton, // Default scope for auto-registered classes
});

// Or pre-register all injectables
container.autoRegisterAll();
```
