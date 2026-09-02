import { Router } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController";
import {
  authenticateFirebase,
  authorizeAdministrator,
} from "../middlewares/auth";

const orderRouter = Router();

// Public route to place an order
orderRouter.post("/", createOrder);

// Protected routes (Admin only)
orderRouter.get("/", authenticateFirebase, authorizeAdministrator, getAllOrders);
orderRouter.get("/:id", authenticateFirebase, authorizeAdministrator, getOrderById);
orderRouter.put(
  "/:id/status",
  authenticateFirebase,
  authorizeAdministrator,
  updateOrderStatus
);

export default orderRouter;
