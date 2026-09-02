import { Router, type RequestHandler } from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/orderController";

export const createOrderRouter = (
  authenticateFirebase: RequestHandler,
  authorizeAdministrator: RequestHandler
): Router => {
  const orderRouter = Router();

  // Public route to place an order.
  orderRouter.post("/", createOrder);

  // Administrator-only order management.
  orderRouter.get("/", authenticateFirebase, authorizeAdministrator, getAllOrders);
  orderRouter.get("/:id", authenticateFirebase, authorizeAdministrator, getOrderById);
  orderRouter.put(
    "/:id/status",
    authenticateFirebase,
    authorizeAdministrator,
    updateOrderStatus
  );

  return orderRouter;
};
