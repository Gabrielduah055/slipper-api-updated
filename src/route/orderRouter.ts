import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController";
import { auth } from "../middlewares/auth";

const orderRouter = Router();

// Public route to place an order
orderRouter.post("/", createOrder);

// Protected routes (Admin only)
orderRouter.get("/", auth, getAllOrders);
orderRouter.get("/:id", auth, getOrderById);
orderRouter.put("/:id/status", auth, updateOrderStatus);

export default orderRouter;
