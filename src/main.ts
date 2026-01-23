import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { SocketIOAdapter } from "./socketio.adapter";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { REDIS_CLIENT } from "./redis/constants/redis.constants";
import { ConsoleLogger, ValidationPipe, BadRequestException } from "@nestjs/common";
import appConfig from "./config/app.config";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    cors: {
      origin: true,
      credentials: true,
    },
    logger: new ConsoleLogger({
      prefix: appConfig.name
    }),
  });

  // Add early request logging middleware for debugging
  app.use((req: any, res: any, next: any) => {
    if (req.path?.includes('/abuse-report') && req.method === 'PATCH') {
      console.log('[EarlyMiddleware] Request received:', {
        method: req.method,
        path: req.path,
        url: req.url,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });
      // Log raw body if available
      if (req.body) {
        try {
          console.log('[EarlyMiddleware] Request body:', JSON.stringify(req.body, null, 2));
        } catch (e) {
          console.log('[EarlyMiddleware] Could not stringify body');
        }
      }
    }
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: false, // Don't throw error for non-whitelisted properties (just strip them)
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
      exceptionFactory: (errors) => {
        // Custom exception factory to ensure we can log before throwing
        console.error('[ValidationPipe] Validation errors detected:', JSON.stringify(errors, null, 2));
        console.error('[ValidationPipe] Error count:', errors.length);
        errors.forEach((error, index) => {
          console.error(`[ValidationPipe] Error ${index + 1}:`, {
            property: error.property,
            value: error.value,
            constraints: error.constraints,
            children: error.children,
          });
        });
        return new BadRequestException(errors);
      },
    }),
  );

  const config = app.get(ConfigService);
  const appName = config.get<string>("app.name")!;

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(`${appName} API documentation`)
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "Bearer",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/reference", app, document, {
    swaggerOptions: {
      urls: [
        {
          url: '/api/reference-json',
          name: 'JSON',
        }
      ],
    },
  });

  app.setGlobalPrefix("api");

  const socketAdapter: any = new SocketIOAdapter(app);
  socketAdapter.connect(app.get(REDIS_CLIENT));
  app.useWebSocketAdapter(socketAdapter);

  if (config.get<boolean>("app.debug")) {
    app.getHttpAdapter().getInstance().set("json spaces", 2);
  }

  const port = config.get<string>("app.port")!;
  await app.listen(port);
}

bootstrap();
