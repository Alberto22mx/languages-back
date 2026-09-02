export function validateEnvironment(config: Record<string, unknown>) {
  const required = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  for (const key of required) {
    if (typeof config[key] !== 'string' || !config[key]) {
      throw new Error(`Falta la variable de entorno ${key}`);
    }
  }

  for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if ((config[key] as string).length < 32) {
      throw new Error(`${key} debe tener al menos 32 caracteres`);
    }
  }
  if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    throw new Error('JWT_SECRET y JWT_REFRESH_SECRET deben ser diferentes');
  }
  if (
    config.NODE_ENV === 'production' &&
    !(config.MONGODB_URI as string).includes('@')
  ) {
    throw new Error('MongoDB debe utilizar credenciales en producción');
  }
  return config;
}
