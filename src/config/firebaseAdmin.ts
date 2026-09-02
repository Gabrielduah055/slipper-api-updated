import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

export class AuthenticationConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationConfigurationError";
  }
}

const REQUIRED_FIREBASE_VARIABLES = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
] as const;

const REQUIRED_AUTHENTICATION_VARIABLES = [
  ...REQUIRED_FIREBASE_VARIABLES,
  "ADMIN_EMAILS",
] as const;

const missingVariables = (names: readonly string[]): string[] =>
  names.filter((name) => !process.env[name]?.trim());

export const validateFirebaseEnvironment = (): void => {
  const missing = missingVariables(REQUIRED_FIREBASE_VARIABLES);

  if (missing.length > 0) {
    throw new AuthenticationConfigurationError(
      `Missing required Firebase Admin environment variables: ${missing.join(", ")}`
    );
  }
};

export const validateAuthenticationEnvironment = (): void => {
  const missing = missingVariables(REQUIRED_AUTHENTICATION_VARIABLES);

  if (missing.length > 0) {
    throw new AuthenticationConfigurationError(
      `Missing required authentication environment variables: ${missing.join(", ")}`
    );
  }
};

const getFirebaseApp = (): App => {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  validateFirebaseEnvironment();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!privateKey) {
    throw new AuthenticationConfigurationError("FIREBASE_PRIVATE_KEY is required");
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey,
    }),
  });
};

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
