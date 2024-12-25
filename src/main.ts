import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/exceptions/http.exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { config } from './v1/swagger/config';
import helmet from 'helmet';
import { logEnvironmentVariables } from './config/env.config';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const prefix = process.env.APP_ROUTE_PREFIX || 'api';
  const port = +process.env.APP_PORT || 3001;
  const host = process.env.APP_HOST || 'localhost';
  const protocol = process.env.APP_PROTOCOL || 'http';
  const url = `${protocol}://${host}:${port}/${prefix}`;

  app.enableCors({
    origin: '*',
    credentials: true,
  });

  app.setGlobalPrefix(prefix);
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.use(helmet());

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);

  const configTest = app.get(ConfigService);

  logEnvironmentVariables(configTest);

  await app
    .listen(port)
    .then(() => console.warn(`WELCOME, YOUR API IS READY ON URL: ${url}`))
    .catch((err) => console.error(err, 'Application is crashed'));
}
bootstrap();
