import * as cors from 'cors';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde el archivo .env
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        callback(null, true);
        return;
      }

      const allowedOrigins = [
        'http://localhost:4200', // Frontend local en desarrollo
        'https://localhost:4200',
        'http://english-4ever.s3-website.us-east-2.amazonaws.com', // Dominio en producción
        'https://english-4ever.s3-website.us-east-2.amazonaws.com',
        'http://52.219.229.136:80',
        'https://52.219.229.136:80',
        'http://english-4ever.s3-website.us-east-2.amazonaws.com/',
        'https://staging.d22scooffsij30.amplifyapp.com',
        'http://staging.d22scooffsij30.amplifyapp.com',
        'http://65.9.121.128:80',
        'https://65.9.121.128:80'
      ];

      // Allow any localhost or 127.0.0.1 origin with any port
      if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
        callback(null, true);
        return;
      }

      // Check against other allowed origins
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }));

  const PORT = process.env.PORT || 8080;
  await app.listen(PORT);

  console.log(`Servidor corriendo en el puerto ${PORT}`);
}

bootstrap();
