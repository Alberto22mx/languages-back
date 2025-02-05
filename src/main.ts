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
    origin: [
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
    ], // Dominio permitido (o toma desde .env)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Métodos permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
    credentials: true, // Permitir envío de credenciales (cookies o tokens)
  }));

  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', req.headers.origin || 'http://localhost:4200');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', 'true');
      return res.status(204).send(); // Respuesta exitosa para OPTIONS
    }
    next();
  });

  // Tomar el puerto desde las variables de entorno o usar 8080 por defecto
  const PORT = process.env.PORT || 8080;
  await app.listen(PORT);

  // Mensajes de depuración
  console.log(`Servidor corriendo en el puerto ${PORT}`);
}

bootstrap();
