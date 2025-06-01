import "reflect-metadata";
import {
  Container,
  DIContainer,
  Inject,
  Injectable,
  InjectionToken,
} from "../../src";

interface IConfigService {
  get(key: string): string;
}

interface ILoggerService {
  info(message: string): void;
  error(message: string, error?: Error): void;
}

interface IDatabaseService {
  connect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any[]>;
  disconnect(): Promise<void>;
}

interface IUserRepository {
  findById(id: number): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<User>;
}

interface IAuthService {
  authenticate(username: string, password: string): Promise<string | null>;
  validateToken(token: string): Promise<boolean>;
}

interface User {
  id: number;
  username: string;
  email: string;
  isActive: boolean;
}

const CONFIG_SERVICE = new InjectionToken<IConfigService>("ConfigService");
const LOGGER_SERVICE = new InjectionToken<ILoggerService>("LoggerService");
const DATABASE_SERVICE = new InjectionToken<IDatabaseService>(
  "DatabaseService"
);
const USER_REPOSITORY = new InjectionToken<IUserRepository>("UserRepository");
const AUTH_SERVICE = new InjectionToken<IAuthService>("AuthService");

@Injectable()
class ConfigService implements IConfigService {
  private config: Map<string, string> = new Map([
    ["db.host", "localhost"],
    ["db.port", "5432"],
    ["db.name", "example_db"],
    ["db.user", "postgres"],
    ["db.password", "secret"],
    ["jwt.secret", "mysecretkey"],
    ["jwt.expiresIn", "1h"],
  ]);

  get(key: string): string {
    const value = this.config.get(key);
    if (value === undefined) {
      throw new Error(`Config key '${key}' not found`);
    }
    return value;
  }
}

@Injectable()
class LoggerService implements ILoggerService {
  info(message: string): void {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error || "");
  }
}

@Injectable()
class DatabaseService implements IDatabaseService {
  constructor(
    @Inject(CONFIG_SERVICE) private configService: IConfigService,
    @Inject(LOGGER_SERVICE) private logger: ILoggerService
  ) {}

  async connect(): Promise<void> {
    const host = this.configService.get("db.host");
    const port = this.configService.get("db.port");
    const dbName = this.configService.get("db.name");

    this.logger.info(`Connecting to database ${dbName} at ${host}:${port}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.logger.info("Database connected");
  }

  async query(sql: string, params: any[] = []): Promise<any[]> {
    this.logger.info(`Executing query: ${sql}`);
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (sql.includes("SELECT * FROM users")) {
      return [
        { id: 1, username: "john", email: "john@example.com", isActive: true },
        { id: 2, username: "jane", email: "jane@example.com", isActive: true },
      ];
    }

    if (sql.includes("SELECT * FROM users WHERE id =")) {
      const id = params[0];
      if (id === 1) {
        return [
          {
            id: 1,
            username: "john",
            email: "john@example.com",
            isActive: true,
          },
        ];
      }
    }

    return [];
  }

  async disconnect(): Promise<void> {
    this.logger.info("Disconnecting from database");
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.logger.info("Database disconnected");
  }
}

@Injectable()
class UserRepository implements IUserRepository {
  constructor(
    @Inject(DATABASE_SERVICE) private db: IDatabaseService,
    @Inject(LOGGER_SERVICE) private logger: ILoggerService
  ) {}

  async findById(id: number): Promise<User | null> {
    this.logger.info(`Finding user with id: ${id}`);
    const result = await this.db.query("SELECT * FROM users WHERE id = ?", [
      id,
    ]);
    return result.length > 0 ? result[0] : null;
  }

  async findAll(): Promise<User[]> {
    this.logger.info("Finding all users");
    return await this.db.query("SELECT * FROM users");
  }

  async save(user: User): Promise<User> {
    this.logger.info(`Saving user: ${user.username}`);
    await new Promise((resolve) => setTimeout(resolve, 50));
    return user;
  }
}

@Injectable()
class AuthService implements IAuthService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    @Inject(CONFIG_SERVICE) private configService: IConfigService,
    @Inject(LOGGER_SERVICE) private logger: ILoggerService
  ) {}

  async authenticate(
    username: string,
    password: string
  ): Promise<string | null> {
    this.logger.info(`Authenticating user: ${username}`);

    if (username === "john" && password === "password") {
      const jwtSecret = this.configService.get("jwt.secret");
      return `token_${username}_${Date.now()}`;
    }

    return null;
  }

  async validateToken(token: string): Promise<boolean> {
    this.logger.info(`Validating token: ${token}`);
    return token.startsWith("token_");
  }
}

@Injectable()
class UserService {
  constructor(
    @Inject(USER_REPOSITORY) private userRepository: IUserRepository,
    @Inject(AUTH_SERVICE) private authService: IAuthService,
    @Inject(LOGGER_SERVICE) private logger: ILoggerService
  ) {}

  async login(username: string, password: string): Promise<string | null> {
    this.logger.info(`Login attempt for user: ${username}`);
    return this.authService.authenticate(username, password);
  }

  async getUserById(id: number, token: string): Promise<User | null> {
    const isValid = await this.authService.validateToken(token);
    if (!isValid) {
      this.logger.error("Invalid token provided");
      throw new Error("Authentication failed");
    }

    return this.userRepository.findById(id);
  }

  async getAllUsers(token: string): Promise<User[]> {
    const isValid = await this.authService.validateToken(token);
    if (!isValid) {
      this.logger.error("Invalid token provided");
      throw new Error("Authentication failed");
    }

    return this.userRepository.findAll();
  }
}

async function main() {
  console.log("=== Real-World Application Example ===");

  const container = new DIContainer();

  container
    .bind<IConfigService>(CONFIG_SERVICE)
    .toClass(ConfigService)
    .inSingletonScope();
  container
    .bind<ILoggerService>(LOGGER_SERVICE)
    .toClass(LoggerService)
    .inSingletonScope();
  container
    .bind<IDatabaseService>(DATABASE_SERVICE)
    .toClass(DatabaseService)
    .inSingletonScope();
  container
    .bind<IUserRepository>(USER_REPOSITORY)
    .toClass(UserRepository)
    .inSingletonScope();
  container
    .bind<IAuthService>(AUTH_SERVICE)
    .toClass(AuthService)
    .inSingletonScope();
  container.bind(UserService).toClass(UserService).inSingletonScope();

  try {
    const db = container.resolve<IDatabaseService>(DATABASE_SERVICE);
    const userService = container.resolve(UserService);

    await db.connect();

    console.log("\nAttempting to login...");
    const token = await userService.login("john", "password");

    if (!token) {
      console.log("Login failed!");
      return;
    }

    console.log("Login successful, token:", token);

    console.log("\nFetching a user...");
    const user = await userService.getUserById(1, token);
    console.log("User:", user);

    console.log("\nFetching all users...");
    const users = await userService.getAllUsers(token);
    console.log("Users:", users);

    await db.disconnect();
  } catch (error) {
    console.error("Application error:", error);
  }
}

main().catch(console.error);
