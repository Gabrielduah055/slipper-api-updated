import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  AuthenticationConfigurationError,
  getFirebaseAuth,
} from "../config/firebaseAdmin";

export type VerifyIdToken = (token: string) => Promise<DecodedIdToken>;
type AdminEmailsProvider = () => string | undefined;

const unauthorized = (res: Response, message: string): void => {
  res.status(401).json({ message });
};

export const createFirebaseAuthentication = (
  verifyIdToken?: VerifyIdToken
): RequestHandler => {
  const verifyToken = verifyIdToken ?? ((token: string) =>
    getFirebaseAuth().verifyIdToken(token));

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authorization = req.headers.authorization;
    const match = typeof authorization === "string"
      ? /^Bearer ([^\s]+)$/.exec(authorization)
      : null;

    if (!match) {
      unauthorized(res, "Authorization header must use Bearer <firebase-id-token>");
      return;
    }

    const token = match[1];
    if (!token) {
      unauthorized(res, "Firebase ID token is required");
      return;
    }

    let firebaseUser: DecodedIdToken;
    try {
      firebaseUser = await verifyToken(token);
    } catch (error) {
      if (error instanceof AuthenticationConfigurationError) {
        next(error);
        return;
      }
      unauthorized(res, "Firebase ID token is invalid or expired");
      return;
    }

    req.firebaseUser = firebaseUser;
    next();
  };
};

export const getAdministratorEmails = (value = process.env.ADMIN_EMAILS): Set<string> =>
  new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );

export const createAdministratorAuthorization = (
  getAdminEmails: AdminEmailsProvider = () => process.env.ADMIN_EMAILS
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const email = req.firebaseUser?.email?.trim().toLowerCase();

    if (!email || !getAdministratorEmails(getAdminEmails()).has(email)) {
      res.status(403).json({ message: "Administrator access is required" });
      return;
    }

    next();
  };
};
