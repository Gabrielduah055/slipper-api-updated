import { Router } from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import { auth } from "../middlewares/auth";

const customerRouter = Router();

// Public routes (or protected depending on requirements, making them public for read, protected for write for now, or all protected. Let's make read public and write protected like products)
customerRouter.get("/", getAllCustomers);
customerRouter.get("/:id", getCustomerById);

// Protected routes
customerRouter.post("/", auth, createCustomer);
customerRouter.put("/:id", auth, updateCustomer);
customerRouter.delete("/:id", auth, deleteCustomer);

export default customerRouter;
