import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import {
  createAdministratorAuthorization,
  createFirebaseAuthentication,
  type VerifyIdToken,
} from "./middlewares/auth";
import { createCustomerRouter } from "./route/customerRouter";
import { createOrderRouter } from "./route/orderRouter";
import { createProductRouter } from "./route/productRouter";

export interface AppDependencies {
  verifyIdToken?: VerifyIdToken;
}

export const createApp = (dependencies: AppDependencies = {}): Express => {
  const app: Express = express();
  const uploadDir = path.join(process.cwd(), "uploads");
  const authenticateFirebase = createFirebaseAuthentication(
    dependencies.verifyIdToken
  );
  const authorizeAdministrator = createAdministratorAuthorization();

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));
  app.use(cookieParser());
  app.use(cors({ credentials: true }));
  app.use("/uploads", express.static(uploadDir));

  app.get("/", (_req: Request, res: Response) => {
    res.send("Hello World!");
  });

  app.use(
    "/api/product",
    createProductRouter(authenticateFirebase, authorizeAdministrator)
  );
  app.use(
    "/api/customers",
    createCustomerRouter(authenticateFirebase, authorizeAdministrator)
  );
  app.use(
    "/api/orders",
    createOrderRouter(authenticateFirebase, authorizeAdministrator)
  );

  return app;
};
