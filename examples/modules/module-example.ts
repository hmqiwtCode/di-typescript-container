import "reflect-metadata";
import {
  Container,
  ContainerModule,
  ConditionalModule,
  AsyncContainerModule,
  DIContainer,
  Injectable,
  InjectionToken,
} from "../../src";

interface Logger {
  log(message: string): void;
}

@Injectable()
class ConsoleLogger implements Logger {
  log(message: string): void {
    console.log(`[INFO] ${message}`);
  }
}

@Injectable()
class FileLogger implements Logger {
  constructor(private filename: string) {}

  log(message: string): void {
    console.log(`[FILE:${this.filename}] ${message}`);
  }
}

interface Config {
  apiUrl: string;
  environment: "development" | "production";
}

const LOGGER = new InjectionToken<Logger>("Logger");
const CONFIG = new InjectionToken<Config>("Config");

const commonModule = new ContainerModule((container: Container) => {
  console.log("Loading common module...");
  container.bind<Config>(CONFIG).toValue({
    apiUrl: "https://api.example.com",
    environment: "development",
  });
});

const developmentModule = new ConditionalModule(
  () => process.env.NODE_ENV !== "production",
  (container: Container) => {
    console.log("Loading development module...");
    container.bind<Logger>(LOGGER).toClass(ConsoleLogger).inSingletonScope();
  }
);

const productionModule = new ConditionalModule(
  () => process.env.NODE_ENV === "production",
  (container: Container) => {
    console.log("Loading production module...");
    container
      .bind<Logger>(LOGGER)
      .toFactory(() => {
        return new FileLogger("app.log");
      })
      .inSingletonScope();
  }
);

const asyncConfigModule = new AsyncContainerModule(
  async (container: Container) => {
    console.log("Loading async config module...");

    const loadedConfig = await new Promise<Config>((resolve) => {
      setTimeout(() => {
        resolve({
          apiUrl: "https://api.example.com/v2",
          environment: "development",
        });
      }, 1000);
    });

    container.rebind<Config>(CONFIG).toValue(loadedConfig);
  }
);

@Injectable()
class ApiService {
  constructor(logger: Logger, config: Config) {
    this.logger = logger;
    this.config = config;
  }

  private logger: Logger;
  private config: Config;

  callApi(): void {
    this.logger.log(
      `Calling API at ${this.config.apiUrl} in ${this.config.environment} mode`
    );
  }
}

async function main() {
  process.env.NODE_ENV = "development";

  const container = new DIContainer();

  container.loadModules([commonModule, developmentModule, productionModule]);

  class ApiServiceFactory {
    static create(container: Container): ApiService {
      const logger = container.resolve<Logger>(LOGGER);
      const config = container.resolve<Config>(CONFIG);
      return new ApiService(logger, config);
    }
  }

  container
    .bind(ApiService)
    .toFactory(() => ApiServiceFactory.create(container))
    .inSingletonScope();

  let apiService = container.resolve(ApiService);
  apiService.callApi();

  console.log("\nUpdating configuration asynchronously...");
  await container.loadAsyncModule(asyncConfigModule);

  apiService = container.resolve(ApiService);
  apiService.callApi();

  console.log("\nChanging environment to production...");
  process.env.NODE_ENV = "production";

  const productionContainer = new DIContainer();
  productionContainer.loadModules([
    commonModule,
    developmentModule,
    productionModule,
  ]);

  productionContainer
    .bind(ApiService)
    .toFactory(() => ApiServiceFactory.create(productionContainer))
    .inSingletonScope();

  const prodApiService = productionContainer.resolve(ApiService);
  prodApiService.callApi();
}

main().catch(console.error);
