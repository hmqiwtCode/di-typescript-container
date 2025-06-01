import "reflect-metadata";
import {
  DIContainer,
  Inject,
  Injectable,
  InjectionToken,
  Named,
  Optional,
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
class ErrorLogger implements Logger {
  log(message: string): void {
    console.error(`[ERROR] ${message}`);
  }
}

interface Config {
  apiUrl: string;
  timeout: number;
}

const LOGGER = new InjectionToken<Logger>("Logger");
const CONFIG = new InjectionToken<Config>("Config");

@Injectable()
class ApiService {
  constructor(
    @Inject(LOGGER) private logger: Logger,
    @Inject(CONFIG) private config: Config
  ) {}

  callApi(): void {
    this.logger.log(`Calling API at ${this.config.apiUrl}`);
  }
}

@Injectable()
class UserService {
  constructor(private api: ApiService) {}

  getUser(id: string): void {
    console.log(`Getting user with ID: ${id}`);
    this.api.callApi();
  }
}

function main() {
  const container = new DIContainer();

  container.bind<Logger>(LOGGER).toClass(ConsoleLogger).inSingletonScope();

  container
    .bind<Logger>(`${LOGGER.toString()}:secondary`)
    .toClass(ErrorLogger)
    .inSingletonScope();

  container.bind<Config>(CONFIG).toValue({
    apiUrl: "https://api.example.com",
    timeout: 5000,
  });

  container.bind(ApiService).toClass(ApiService).inSingletonScope();
  container.bind(UserService).toClass(UserService).inSingletonScope();

  const userService = container.resolve(UserService);

  userService.getUser("123");
}

main();
