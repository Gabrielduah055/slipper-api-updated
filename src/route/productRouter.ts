import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
} from "../controllers/productController";
import { auth } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const productRouter = Router();

//public;
productRouter.get("/categories", getProductCategories);
productRouter.get("/", getAllProducts);
productRouter.get("/:id", getProductById);

//protected admin only
productRouter.post(
  "/",
  auth,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "productThumbnailImages", maxCount: 5 },
  ]),
  createProduct
);
productRouter.put(
  "/:id",
  auth,
  upload.fields([
    { name: "productImage", maxCount: 1 },
    { name: "productThumbnailImages", maxCount: 5 },
  ]),
  updateProduct
);
productRouter.delete("/:id", auth, deleteProduct);

export default productRouter;
