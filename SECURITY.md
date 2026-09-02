# Seguridad y operación

- Genera secretos con `openssl rand -base64 48`. No reutilices valores entre entornos.
- MongoDB se publica únicamente en `127.0.0.1:27018`; no abras ese puerto a Internet.
- Inicia la base con `docker compose up -d mongodb`. El volumen `mongodb_data` conserva los datos.
- La imagen 8.0.4 está fijada por compatibilidad con el kernel 6.19 local; revisa esta restricción antes de actualizarla.
- El usuario de la aplicación solo tiene `readWrite` sobre `englishforever`; no uses el usuario root en `MONGODB_URI`.
- En producción usa TLS, una red privada o lista de IP permitidas y el gestor de secretos del proveedor.
- Realiza respaldos cifrados y prueba regularmente una restauración.
- Los access tokens duran poco. El backend guarda el refresh token en una cookie `HttpOnly`, `Secure` en producción y `SameSite=Strict`; no lo copies a `localStorage`.
- El alta devuelve `setupToken` solamente cuando el correo está desactivado. Trátalo como un secreto de un solo uso.

## Primer administrador

La base nueva no contiene usuarios. Define temporalmente `ADMIN_FIRST_NAME`, `ADMIN_LAST_NAME_FATHER`, `ADMIN_EMAIL`, `ADMIN_PHONE` y `ADMIN_BIRTH_DATE`, y ejecuta `npm run admin:create`. El comando muestra un token de activación una sola vez; úsalo en `POST /auth/set-password`. Después elimina esas variables del entorno.
