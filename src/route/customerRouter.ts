import { Router } from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController";
import {
  authenticateFirebase,
  authorizeAdministrator,
} from "../middlewares/auth";

const customerRouter = Router();

// Customer records contain personal information and are administrator-only.
customerRouter.get("/", authenticateFirebase, authorizeAdministrator, getAllCustomers);
customerRouter.get("/:id", authenticateFirebase, authorizeAdministrator, getCustomerById);

// Customers may register without an administrator session.
customerRouter.post("/", createCustomer);
customerRouter.put("/:id", authenticateFirebase, authorizeAdministrator, updateCustomer);
customerRouter.delete("/:id", authenticateFirebase, authorizeAdministrator, deleteCustomer);

export default customerRouter;
