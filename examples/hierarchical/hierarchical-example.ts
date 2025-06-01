import "reflect-metadata";
import { DIContainer, Inject, Injectable, InjectionToken } from "../../src";

interface ILogger {
  log(message: string): void;
}

interface IConfig {
  apiUrl: string;
  timeout: number;
}

const LOGGER = new InjectionToken<ILogger>("Logger");
const CONFIG = new InjectionToken<IConfig>("Config");
const API_URL = new InjectionToken<string>("ApiUrl");

@Injectable()
class ConsoleLogger implements ILogger {
  constructor(private prefix: string = "INFO") {}

  log(message: string): void {
    console.log(`[${this.prefix}] ${message}`);
  }
}

@Injectable()
class ApiService {
  constructor(
    @Inject(LOGGER) private logger: ILogger,
    @Inject(CONFIG) private config: IConfig
  ) {}

  callApi(): void {
    this.logger.log(
      `Calling API at ${this.config.apiUrl} with timeout ${this.config.timeout}ms`
    );
  }
}

@Injectable()
class UserApiService {
  constructor(
    @Inject(LOGGER) private logger: ILogger,
    @Inject(API_URL) private apiUrl: string
  ) {}

  getUsers(): void {
    this.logger.log(`Fetching users from ${this.apiUrl}`);
  }
}

function main() {
  console.log("Creating parent container...");
  const parentContainer = new DIContainer();

  parentContainer
    .bind<ILogger>(LOGGER)
    .toFactory(() => new ConsoleLogger("PARENT"))
    .inSingletonScope();

  parentContainer.bind<IConfig>(CONFIG).toValue({
    apiUrl: "https://api.example.com",
    timeout: 5000,
  });

  console.log("\nCreating first child container...");
  const apiContainer = parentContainer.createChildContainer();

  apiContainer
    .bind<ILogger>(LOGGER)
    .toFactory(() => new ConsoleLogger("API"))
    .inSingletonScope();

  apiContainer.bind(ApiService).toClass(ApiService).inSingletonScope();

  console.log("\nCreating second child container...");
  const userContainer = parentContainer.createChildContainer();

  userContainer.bind<string>(API_URL).toValue("https://api.example.com/users");

  userContainer.bind(UserApiService).toClass(UserApiService).inSingletonScope();

  console.log("\nResolving services from parent container:");
  const parentLogger = parentContainer.resolve<ILogger>(LOGGER);
  parentLogger.log("This is the parent logger");

  console.log("\nResolving services from API container:");
  const apiService = apiContainer.resolve(ApiService);
  apiService.callApi();

  console.log("\nResolving services from User container:");
  const userApiService = userContainer.resolve(UserApiService);
  userApiService.getUsers();

  console.log("\nResolving parent service through child container:");
  const config = userContainer.resolve<IConfig>(CONFIG);
  console.log("Config from parent:", config);
}

console.log("=== Hierarchical Container Example ===");
main();
