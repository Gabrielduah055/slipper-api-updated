import { Router, type RequestHandler } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductCategories,
} from "../controllers/productController";
import { upload } from "../middlewares/upload";

export const createProductRouter = (
  authenticateFirebase: RequestHandler,
  authorizeAdministrator: RequestHandler
): Router => {
  const productRouter = Router();

  // Public storefront routes.
  productRouter.get("/categories", getProductCategories);
  productRouter.get("/", getAllProducts);
  productRouter.get("/:id", getProductById);

  // Administrator-only product mutations.
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

  return productRouter;
};
