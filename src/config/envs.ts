import * as dotenv from 'dotenv';
import * as joi from 'joi';

dotenv.config(); // Carga variables desde .env

interface EnvVars {
  PORT: number;
  MONGODB_URI: string;
  NODE_ENV: 'development' | 'production' | 'test';
  JWT_SECRET: string;
  CLERK_SECRET_KEY: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FACEBOOK_APP_ID: string;
  FACEBOOK_APP_SECRET: string;
  ENABLE_SWAGGER?: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    MONGODB_URI: joi.string().required(),
    NODE_ENV: joi
      .string()
      .valid('development', 'production', 'test')
      .default('development'),
    JWT_SECRET: joi.string().required(),
    CLERK_SECRET_KEY: joi.string().required(),
    CLOUDINARY_CLOUD_NAME: joi.string().required(),
    CLOUDINARY_API_KEY: joi.string().required(),
    CLOUDINARY_API_SECRET: joi.string().required(),
    GOOGLE_CLIENT_ID: joi.string().required(),
    GOOGLE_CLIENT_SECRET: joi.string().required(),
    FACEBOOK_APP_ID: joi.string().required(),
    FACEBOOK_APP_SECRET: joi.string().required(),
    ENABLE_SWAGGER: joi.string().valid('true', 'false').optional(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate(process.env) as {
  error?: Error;
  value: EnvVars;
};

if (error) {
  throw new Error(`❌ Config validation error: ${error.message}`);
}

export const envs = {
  port: value.PORT,
  mongodbUri: value.MONGODB_URI,
  nodeEnv: value.NODE_ENV,
  jwtSecret: value.JWT_SECRET,
  clerkSecretKey: value.CLERK_SECRET_KEY,
  cloudinary: {
    name: value.CLOUDINARY_CLOUD_NAME,
    apiKey: value.CLOUDINARY_API_KEY,
    apiSecret: value.CLOUDINARY_API_SECRET,
  },
  google: {
    clientId: value.GOOGLE_CLIENT_ID,
    clientSecret: value.GOOGLE_CLIENT_SECRET,
  },
  facebook: {
    appId: value.FACEBOOK_APP_ID,
    appSecret: value.FACEBOOK_APP_SECRET,
  },
  enableSwagger: value.ENABLE_SWAGGER === 'true',
};
