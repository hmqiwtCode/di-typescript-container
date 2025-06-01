# TypeScript Dependency Injection (DI) Container

A powerful and flexible TypeScript dependency injection container with support for:

- Class, value, and factory bindings
- Constructor, method, and property injection
- Singleton, transient, and request-scoped lifetimes
- Container hierarchy and child containers
- Module system for organizing bindings
- Conditional and asynchronous module loading
- Middleware and AOP-style interceptors
- Auto-injection of services without explicit binding
- Token-based auto-injection for interface/implementation patterns
- Lazy resolution and circular dependency handling

## Installation

```bash
npm install di-typescript-container
```

## Basic Usage

```typescript
import "reflect-metadata";
import {
  container,
  Injectable,
  Inject,
  InjectionToken,
} from "di-typescript-container";

// Define a service
@Injectable()
class UserService {
  getUsers() {
    return ["Alice", "Bob", "Charlie"];
  }
}

// Define another service that depends on UserService
@Injectable()
class AppService {
  constructor(private userService: UserService) {}

  getGreeting() {
    const users = this.userService.getUsers();
    return `Hello ${users.join(", ")}!`;
  }
}

// Resolve the service from the container
const app = container.resolve(AppService);
console.log(app.getGreeting()); // "Hello Alice, Bob, Charlie!"
```

## Core Features

### Auto-Injection

Automatically register classes with the `@Injectable()` decorator:

```typescript
// No explicit bindings needed!
@Injectable()
class UserService {
  getUsers() {
    return ["Alice", "Bob", "Charlie"];
  }
}

@Injectable()
class AppService {
  constructor(private userService: UserService) {}

  getGreeting() {
    return `Hello ${this.userService.getUsers().join(", ")}!`;
  }
}

// Create a container with auto-registration enabled (default)
const container = new DIContainer();

// Resolve without explicit binding registration
const app = container.resolve(AppService);
console.log(app.getGreeting()); // "Hello Alice, Bob, Charlie!"
```

### Token-Based Auto-Injection

Register implementations for interfaces using tokens:

```typescript
// Define an interface token
const USER_SERVICE = new InjectionToken<UserService>("UserService");

// Register implementation with token
@Injectable(USER_SERVICE)
class UserServiceImpl implements UserService {
  getUsers() {
    return ["Alice", "Bob", "Charlie"];
  }
}

@Injectable()
class AppService {
  constructor(@Inject(USER_SERVICE) private userService: UserService) {}

  getGreeting() {
    return `Hello ${this.userService.getUsers().join(", ")}!`;
  }
}

// No explicit binding needed - resolve by token
const app = container.resolve(AppService);
```

### Binding Types

```typescript
// Class binding
container
  .bind<UserService>(UserService)
  .toClass(UserService)
  .inSingletonScope();

// Value binding
const CONFIG_TOKEN = new InjectionToken<Config>("Config");
container.bind(CONFIG_TOKEN).toValue({ apiUrl: "https://api.example.com" });

// Factory binding
container
  .bind<Database>(Database)
  .toFactory((ctx) => {
    const config = ctx.resolve(CONFIG_TOKEN);
    return new Database(config.dbConnectionString);
  })
  .inSingletonScope();
```

### Injection Decorators

```typescript
@Injectable()
class EmailService {
  constructor(
    // Standard injection based on type
    private userService: UserService,

    // Token-based injection
    @Inject(CONFIG_TOKEN) private config: Config,

    // Optional dependency
    @Optional() private logger?: Logger,

    // Named dependency
    @Named("admin") private adminUserService?: UserService
  ) {}
}
```

### Scope Management

```typescript
// Singleton - shared instance for all consumers
container
  .bind<UserService>(UserService)
  .toClass(UserService)
  .inSingletonScope();

// Transient - new instance each time it's resolved
container
  .bind<RequestHandler>(RequestHandler)
  .toClass(RequestHandler)
  .inTransientScope();

// Request scope - same instance within a request context
container.bind<Session>(Session).toClass(Session).inRequestScope();
```

### Child Containers

```typescript
// Create a child container that inherits parent bindings
const childContainer = container.createChildContainer();

// Override a binding in the child container
childContainer.rebind<Logger>(Logger).toClass(CustomLogger);
```

## Module System

```typescript
import {
  ContainerModule,
  ConditionalModule,
  AsyncContainerModule,
} from "di-typescript-container";

// Create a module with related bindings
const userModule = new ContainerModule((container) => {
  container
    .bind<UserService>(UserService)
    .toClass(UserService)
    .inSingletonScope();
  container
    .bind<UserRepository>(UserRepository)
    .toClass(UserRepository)
    .inSingletonScope();
});

// Create a conditional module for environment-specific bindings
const devModule = new ConditionalModule(
  () => process.env.NODE_ENV === "development",
  (container) => {
    container.bind<Logger>(Logger).toClass(DevLogger).inSingletonScope();
  }
);

// Create an async module (e.g., for loading config)
const configModule = new AsyncContainerModule(async (container) => {
  const config = await loadConfigAsync();
  container.bind(CONFIG_TOKEN).toValue(config);
});

// Load modules
container.loadModules([userModule, devModule]);
await container.loadAsyncModule(configModule);
```

## Advanced Features

### Hierarchical Resolution

The container can resolve dependencies from its parent container if they're not found in the current container.

### Circular Dependencies

The container handles circular dependencies using lazy loading:

```typescript
// Define tokens for our interfaces
const SERVICE_A = new InjectionToken<ServiceA>("ServiceA");
const SERVICE_B = new InjectionToken<ServiceB>("ServiceB");

@Injectable(SERVICE_A)
class ServiceAImpl implements ServiceA {
  constructor(@Lazy(SERVICE_B) @Inject(SERVICE_B) private serviceB: ServiceB) {}

  // Implementation...
}

@Injectable(SERVICE_B)
class ServiceBImpl implements ServiceB {
  constructor(@Lazy(SERVICE_A) @Inject(SERVICE_A) private serviceA: ServiceA) {}

  // Implementation...
}

// Auto-injection handles the circular dependency
const serviceA = container.resolve(SERVICE_A);
```

### Contextual Binding with Named Injections

```typescript
container
  .bind<UserService>(UserService)
  .toClass(UserService)
  .inSingletonScope();
container
  .bind<UserService>("UserService:admin")
  .toClass(AdminUserService)
  .inSingletonScope();

@Injectable()
class UserController {
  constructor(
    private regularUserService: UserService,
    @Named("admin") private adminUserService: UserService
  ) {}
}
```

## License

MIT
