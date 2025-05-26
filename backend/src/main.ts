import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggerService } from './core/services/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = app.get(LoggerService);

  // Configuración global
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('ReplikStore API')
    .setDescription('API para la gestión de inventario, notificaciones y reportes')
    .setVersion('1.0')
    .addTag('inventory', 'Gestión de inventario')
    .addTag('notifications', 'Sistema de notificaciones')
    .addTag('reports', 'Generación de reportes')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Iniciar servidor
  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Aplicación iniciada en el puerto ${port}`);
  logger.log(`Documentación Swagger disponible en http://localhost:${port}/api`);
}

bootstrap(); 