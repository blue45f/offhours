import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import compression from 'compression'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { Logger } from 'nestjs-pino'

import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { ZodValidationFilter } from './common/filters/zod-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  })
  // Structured logging via nestjs-pino (JSON in prod, pino-pretty in dev) +
  // HTTP request autoLogging. Replaces the default unstructured console logger.
  app.useLogger(app.get(Logger))

  app.setGlobalPrefix('api', { exclude: ['health'] })

  app.use(compression())
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  )
  app.use(cookieParser())

  const corsOrigin = process.env.APP_URL ?? 'http://localhost:5173'
  app.enableCors({
    origin: [corsOrigin, 'http://localhost:5174'],
    credentials: true,
  })

  app.useGlobalFilters(new ZodValidationFilter(), new HttpExceptionFilter())

  const swagger = new DocumentBuilder()
    .setTitle('Offhours API')
    .setDescription('영업 외 시간 공간 대여 플랫폼 API')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swagger)
  SwaggerModule.setup('api/docs', app, document)

  // Let Nest run PrismaService.onModuleDestroy ($disconnect) on SIGTERM/SIGINT
  // so container deploys close the DB pool cleanly instead of leaking it.
  app.enableShutdownHooks()

  const port = Number(process.env.PORT ?? 3000)
  await app.listen(port)
  console.log(`🚀 Offhours API listening on http://localhost:${port}`)
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`)
}

void bootstrap()
