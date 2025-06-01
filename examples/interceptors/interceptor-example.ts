import "reflect-metadata";
import {
  DIContainer,
  Injectable,
  Interceptor,
  InvocationContext,
  Intercept,
} from "../../src";

class LoggingInterceptor implements Interceptor {
  intercept(context: InvocationContext, next: () => any): any {
    const { methodName, args } = context;

    console.log(`[BEFORE] Calling ${String(methodName)} with args:`, args);

    const startTime = Date.now();
    const result = next();
    const endTime = Date.now();

    console.log(
      `[AFTER] ${String(methodName)} executed in ${endTime - startTime}ms`
    );
    console.log(`[AFTER] Result:`, result);

    return result;
  }
}

class CachingInterceptor implements Interceptor {
  private cache = new Map<string, any>();

  intercept(context: InvocationContext, next: () => any): any {
    const { methodName, args } = context;

    const cacheKey = `${String(methodName)}_${JSON.stringify(args)}`;

    if (this.cache.has(cacheKey)) {
      console.log(`[CACHE] Cache hit for ${cacheKey}`);
      return this.cache.get(cacheKey);
    }

    console.log(`[CACHE] Cache miss for ${cacheKey}`);

    const result = next();
    this.cache.set(cacheKey, result);

    return result;
  }
}

@Injectable()
class UserService {
  private users = [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
    { id: 3, name: "Charlie" },
  ];

  @Intercept(new LoggingInterceptor())
  getUserById(id: number): any {
    console.log(`[SERVICE] Finding user with ID ${id}`);

    const startTime = Date.now();
    while (Date.now() < startTime + 100) {}

    return this.users.find((user) => user.id === id);
  }

  @Intercept(new CachingInterceptor(), new LoggingInterceptor())
  getAllUsers(): any[] {
    console.log(`[SERVICE] Getting all users`);

    const startTime = Date.now();
    while (Date.now() < startTime + 200) {}

    return [...this.users];
  }
}

function main() {
  const container = new DIContainer();

  container.bind(UserService).toClass(UserService).inSingletonScope();

  const userService = container.resolve(UserService);

  console.log("\n--- First call to getUserById ---");
  const user1 = userService.getUserById(1);

  console.log("\n--- Second call to getUserById (same ID) ---");
  const user1Again = userService.getUserById(1);

  console.log("\n--- First call to getAllUsers ---");
  const allUsers = userService.getAllUsers();

  console.log("\n--- Second call to getAllUsers ---");
  const allUsersAgain = userService.getAllUsers();

  console.log("\n--- Different user ID ---");
  const user2 = userService.getUserById(2);
}

console.log("=== Interceptors Example ===");
main();
