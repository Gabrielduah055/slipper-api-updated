import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";
import customerRouter from "./route/customerRouter";
import orderRouter from "./route/orderRouter";
import productRouter from "./route/productRouter";

const app: Express = express();
const uploadDir = path.join(process.cwd(), "uploads");

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

app.use("/api/product", productRouter);
app.use("/api/customers", customerRouter);
app.use("/api/orders", orderRouter);

export default app;
