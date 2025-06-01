import "reflect-metadata";
import {
  DIContainer,
  Injectable,
  InjectionToken,
  Inject,
  Lazy,
  LAZY_TOKEN_STORAGE,
} from "../../src";

interface IUserService {
  getAuthenticatedUser(): string;
  loginUser(username: string, password: string): void;
}

interface IAuthService {
  login(username: string, password: string): string;
  getUserData(token: string): { name: string };
  validateUser(token: string): boolean;
}

const USER_SERVICE = new InjectionToken<IUserService>("UserService");
const AUTH_SERVICE = new InjectionToken<IAuthService>("AuthService");

console.log("USER_SERVICE token:", USER_SERVICE);
console.log("AUTH_SERVICE token:", AUTH_SERVICE);

// User service depends on AuthService directly via constructor,
// but we mark it as @Lazy to handle circular dependency
@Injectable()
class UserService implements IUserService {
  private currentUser: string | null = null;

  constructor(
    @Lazy(AUTH_SERVICE) @Inject(AUTH_SERVICE) private authService: IAuthService
  ) {
    console.log(`[UserService] Created with lazy-loaded AuthService`);
  }

  getAuthenticatedUser(): string {
    if (!this.currentUser) {
      console.log(`[UserService] No user currently logged in`);
      return "Anonymous";
    }

    const isValid = this.authService.validateUser(this.currentUser);
    if (!isValid) {
      console.log(`[UserService] User token is invalid`);
      this.currentUser = null;
      return "Anonymous";
    }

    const userData = this.authService.getUserData(this.currentUser);
    console.log(`[UserService] User is authenticated as ${userData.name}`);
    return userData.name;
  }

  loginUser(username: string, password: string): void {
    console.log(`[UserService] Attempting to login ${username}...`);

    console.log("[UserService] authService type:", typeof this.authService);
    console.log(
      "[UserService] authService is proxy:",
      this.authService.toString &&
        this.authService.toString().includes("LazyProxy")
    );

    try {
      const token = this.authService.login(username, password);
      this.currentUser = token;
    } catch (error) {
      console.error("[UserService] Error in loginUser:", error);
      throw error;
    }
  }
}

// Auth service depends on UserService directly via constructor,
// but we mark it as @Lazy to handle circular dependency
@Injectable()
class AuthService implements IAuthService {
  constructor(
    @Lazy(USER_SERVICE) @Inject(USER_SERVICE) private userService: IUserService
  ) {
    console.log(`[AuthService] Created with lazy-loaded UserService`);
  }

  login(username: string, password: string): string {
    console.log(`[AuthService] Login ${username} with password ${password}`);
    return `token_${username}_${Date.now()}`;
  }

  getUserData(token: string): { name: string } {
    console.log(`[AuthService] Getting user data for token ${token}`);
    const username = token.split("_")[1];
    return { name: username };
  }

  validateUser(token: string): boolean {
    console.log(`[AuthService] Validating token ${token}`);
    return token.startsWith("token_");
  }

  getUserService(): IUserService {
    return this.userService;
  }
}

function main() {
  console.log("=== @Lazy Decorator for Circular Dependencies Example ===");
  console.log("Creating container...");
  const container = new DIContainer();

  console.log("Stored lazy tokens:", LAZY_TOKEN_STORAGE);

  console.log("\nResolving UserService...");
  const userService = container.resolve<IUserService>(USER_SERVICE);

  console.log("\nCurrent user before login:");
  const beforeUser = userService.getAuthenticatedUser();
  console.log(`Current user is: ${beforeUser}`);

  console.log("\nPerforming login:");
  userService.loginUser("alice", "password123");

  console.log("\nCurrent user after login:");
  const afterUser = userService.getAuthenticatedUser();
  console.log(`Current user is: ${afterUser}`);
}

main();
