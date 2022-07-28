import { LogLevel, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as session from "express-session";
import * as passport from "passport";
import helmet from "helmet";
import { install } from "source-map-support";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SessionAdapter } from "./shared/websocket/session.adapter";
import * as Redis from "redis";

let RedisStore = require("connect-redis")(session);

install();

async function bootstrap() {

  const env: string | undefined = process.env.NODE_ENV;
  const defaultLogLevels: LogLevel[] = ["error", "warn", "log"];
  if (env === "development") {
    defaultLogLevels.push("debug");
  }

  const app: NestExpressApplication = await NestFactory.create(AppModule, {
    logger: defaultLogLevels
  });

  const config: ConfigService = app.get<ConfigService>(ConfigService);

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port: number = config.get<number>("PORT");
  const secret: string = config.get<string>("SESSION_SECRET");
  const frontendOrigin: string = config.get<string>("FRONTEND_ORIGIN");
  const redisPort: number = +config.get<number>("REDIS_PORT");
  const redisHost: string = config.get<string>("REDIS_HOST");

  const redisClient = new Redis.createClient({ port: redisPort, host: redisHost });
  const redisStore = new RedisStore({ client: redisClient, disableTTL: true });

  app.use(helmet());
  app.enableCors({
    credentials: true,
    origin: frontendOrigin
  });

  const sessionMiddleware = session({
    store: redisStore,
    secret,
    resave: false,
    saveUninitialized: false,
    name: "art7.session",
    cookie: {
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: false,
      secure: env !== "development"
    },
    proxy: env !== "development"
  });

  app.use(sessionMiddleware);

  app.use(passport.initialize());
  app.use(passport.session());

  app.useWebSocketAdapter(new SessionAdapter(sessionMiddleware, app));

  await app.listen(port, () => {
    console.log("[WEB]", config.get<string>("BASE_URL"));
  });
}

bootstrap();
