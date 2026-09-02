import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
} from "../controllers/productController";
import {
  authenticateFirebase,
  authorizeAdministrator,
} from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const productRouter = Router();

//public;
productRouter.get("/categories", getProductCategories);
productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProductById);

//protected admin only
productRouter.post(
  "/",
  authenticateFirebase,
  authorizeAdministrator,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "productThumbnailImages", maxCount: 5 },
  ]),
  createProduct
);
productRouter.put(
  "/:id",
  authenticateFirebase,
  authorizeAdministrator,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "productThumbnailImages", maxCount: 5 },
  ]),
  updateProduct
);
productRouter.delete(
  "/:id",
  authenticateFirebase,
  authorizeAdministrator,
  deleteProduct
);

export default productRouter;
