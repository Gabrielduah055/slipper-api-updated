import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import connetDB from "./config/mongodb";
import adminRouter from "./route/adminRouter";
import productRouter from "./route/productRouter";
import customerRouter from "./route/customerRouter";
import orderRouter from "./route/orderRouter";
import path from "path";
import fs from 'fs';
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this to your frontend URL in production
    methods: ["GET", "POST"]
  }
});

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

// Make io available in routes via req.app.get('io')
app.set('io', io);

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use('/uploads', express.static(uploadDir));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});

app.use("/api/admin", adminRouter);
app.use("/api/product", productRouter);
app.use("/api/customers", customerRouter);
app.use("/api/orders", orderRouter);

// Use httpServer.listen instead of app.listen
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
