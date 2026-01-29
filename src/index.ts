import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connetDB from "./config/mongodb";
import adminRouter from "./route/adminRouter";
import productRouter from "./route/productRouter";
import customerRouter from "./route/customerRouter";
import path from "path";
import fs from 'fs';

dotenv.config();



const app: Express = express();
const port = process.env.PORT || 5000;
connetDB();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true }));

app.use('/uploads', express.static(uploadDir));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/admin", adminRouter);
app.use("/api/product", productRouter);
app.use("/api/customers", customerRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
