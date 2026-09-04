# English Forever API

Backend de English Forever construido con NestJS, MongoDB, JWT y control de acceso por roles.

## Requisitos

- Node.js 20 LTS y npm.
- MongoDB accesible, o Docker con Docker Compose para usar la instancia local incluida.
- El frontend `languages` para utilizar la aplicación completa.

## Instalación local

```bash
npm install
```

Crea un `.env` en la raíz de `languages-back`. No subas este archivo ni secretos al repositorio:

```dotenv
NODE_ENV=development
PORT=8080

MONGO_ROOT_USERNAME=elige_un_usuario_root
MONGO_ROOT_PASSWORD=elige_una_clave_root_segura
MONGO_APP_USERNAME=englishforever_app
MONGO_APP_PASSWORD=elige_una_clave_app_segura
MONGODB_URI=mongodb://englishforever_app:CLAVE_APP@127.0.0.1:27018/englishforever?authSource=englishforever

# Diferentes entre sí y de al menos 32 caracteres
JWT_SECRET=genera_un_secreto_largo_y_aleatorio
JWT_REFRESH_SECRET=genera_otro_secreto_largo_y_aleatorio
JWT_EXPIRES_IN=20m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

# Orígenes separados por coma y sin diagonal final
CORS_ORIGIN=http://localhost:4200
FRONTEND_URL=http://localhost:4200

MAIL_ENABLED=false
MAIL_PROVIDER=gmail
MAIL_USER=
MAIL_PASSWORD=

# Usadas solamente por npm run admin:create
ADMIN_FIRST_NAME=Administrador
ADMIN_LAST_NAME_FATHER=Principal
ADMIN_LAST_NAME_MOTHER=Sistema
ADMIN_PHONE=+525562894798
ADMIN_EMAIL=alberto22mx@gmail.com
ADMIN_BIRTH_DATE=1990-01-01
ADMIN_REGISTRATION_NUMBER=ADM000001
```

Si una contraseña de MongoDB contiene caracteres reservados como `@`, `:`, `/` o `#`, codifícala para URL dentro de `MONGODB_URI`.

Inicia MongoDB y comprueba su estado:

```bash
docker compose up -d mongodb
docker compose ps
```

El usuario MongoDB de la aplicación se crea solo al inicializar un volumen nuevo. Cambiar después `MONGO_APP_USERNAME` o `MONGO_APP_PASSWORD` no modifica automáticamente el usuario guardado. No elimines el volumen en producción: hacerlo borra la base de datos.

Inicia la API:

```bash
npm run start:dev
```

Estará disponible de forma predeterminada en `http://localhost:8080`.

## Inicialización obligatoria de ADM000001

`ADM000001` es la cuenta protegida. Debe existir antes de administrar usuarios y no puede deshabilitarse, eliminarse, cambiar de matrícula ni perder el rol `admin`.

Con MongoDB disponible y las variables `ADMIN_*` configuradas, ejecuta una sola vez:

```bash
npm run admin:create
```

El comando imprime un token de activación de un solo uso, válido durante 24 horas. Guárdalo: no se vuelve a mostrar. Como todavía no existe una pantalla de activación en el frontend, establece la contraseña llamando a la API:

```bash
curl -i -X POST http://localhost:8080/auth/set-password \
  -H 'Content-Type: application/json' \
  --data '{
    "registrationNumber": "ADM000001",
    "token": "TOKEN_GENERADO",
    "password": "UnaClaveSegura123!"
  }'
```

Una respuesta `204 No Content` confirma el cambio. Después verifica el acceso:

```bash
curl -i -X POST http://localhost:8080/auth/login \
  -H 'Content-Type: application/json' \
  --data '{
    "registrationNumber": "ADM000001",
    "password": "UnaClaveSegura123!"
  }'
```

No normalices usuarios hasta confirmar este inicio de sesión.

### Si ya existe otro administrador

`admin:create` se detiene si encuentra cualquier cuenta con rol `admin`. Si existe un administrador con otra matrícula, primero respalda la base y migra esa cuenta de forma controlada a `ADM000001`, o elimina el conflicto únicamente si confirmaste que es prescindible. No hagas cambios directos sobre producción sin respaldo.

## Habilitación y deshabilitación

- Las cuentas nuevas se crean como `inactive`.
- `ADM000001` las habilita desde **Administración de usuarios**.
- Un usuario inactivo no puede iniciar sesión, renovar tokens ni usar un access token emitido anteriormente.
- `ADM000001` siempre permanece activo.

Para dejar inactivas todas las cuentas existentes excepto `ADM000001`:

```bash
npm run users:disable-except-admin
```

El comando primero exige que exista exactamente un `ADM000001`; si no lo encuentra, se detiene antes de modificar otras cuentas. También elimina los refresh tokens de las cuentas deshabilitadas. Es idempotente.

## Orden recomendado para producción

1. Crea un respaldo de MongoDB.
2. Configura variables y secretos en el proveedor; no uses un `.env` versionado.
3. Usa `NODE_ENV=production`, HTTPS y una `MONGODB_URI` autenticada.
4. Configura `CORS_ORIGIN` con la URL exacta del frontend.
5. Ejecuta `npm ci`, `npm run build` y despliega la API.
6. Ejecuta `npm run admin:create` si aún no existe `ADM000001`.
7. Establece su contraseña y verifica el login.
8. Ejecuta `npm run users:disable-except-admin`.
9. Despliega el frontend apuntando a esta API.
10. Verifica login, listado, habilitación, deshabilitación y rechazo de una cuenta inactiva.

No configures `admin:create` ni `users:disable-except-admin` como comandos automáticos de arranque. Son tareas administrativas explícitas.

Si frontend y API viven en dominios diferentes, prueba CORS y cookies en el navegador. La cookie de refresh actual usa `SameSite=Strict`; lo más sencillo es publicar ambos bajo el mismo sitio o enrutar la API mediante un proxy del mismo dominio.

## Correo de activación

Con `MAIL_ENABLED=true`, configura `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_PROVIDER` y `FRONTEND_URL`. Al crear un usuario se envía un enlace de activación. Con `MAIL_ENABLED=false`, la API devuelve el `setupToken` al administrador; entrégalo por un canal seguro.

## Comandos

```bash
npm run start:dev                    # desarrollo con recarga
npm run build                        # compilar
npm run start:prod                   # ejecutar dist/main.js
npm test                             # pruebas unitarias
npm run test:cov                     # cobertura
npm run admin:create                 # crear administrador inicial
npm run users:disable-except-admin   # normalizar estados
```

Producción:

```bash
npm ci
npm run build
npm run start:prod
```

## Diagnóstico rápido

- **Falta una variable:** revisa `MONGODB_URI`, `JWT_SECRET` y `JWT_REFRESH_SECRET`.
- **MongoDB rechaza la conexión:** confirma puerto, `authSource`, credenciales y `docker compose ps`.
- **CORS bloquea el frontend:** agrega su origen exacto a `CORS_ORIGIN`, sin rutas ni diagonal final.
- **El administrador no inicia sesión:** verifica matrícula, contraseña y estado `active`.
- **El token expiró:** los tokens de activación duran 24 horas.
- **La normalización se detiene:** confirma que exista exactamente un `ADM000001`.

## Seguridad

Consulta [SECURITY.md](./SECURITY.md). Nunca publiques `.env`, credenciales, tokens de activación, secretos JWT ni respaldos.
