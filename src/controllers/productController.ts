import e, { Request, Response, RequestHandler } from "express";
import Product from "../models/ProductSchema";
import { uploadBufferToCloudinary } from "../utils/cloudinary_upload";

const PRODUCT_CATEGORIES = ["Half Shoe", "Sandal", "Slippers", "Shoe", "Sneaker", "Others"] as const;


export const getProductCategories: RequestHandler = async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: 'Product categories fetched successfully',
      categories: PRODUCT_CATEGORIES,
    })
  } catch (error) {
    console.error('Error getting product categories:', error);
    res.status(500).json({ message: 'Failed to get product categories' });
  }
}

// Get all products
export const getAllProducts: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true }).sort({
      createdAt: -1,
    });
    res.status(200).json({
      message: "Products fetched successfully",
      products: products,
    });
  } catch (error) {
    console.error("Error getting all products:", error);
    res.status(500).json({ message: "Failed to get all products" });
  }
};

//get product by id
export const getProductById: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(200).json({
      message: "Product fetched successfully",
      product: product,
    });
  } catch (error) {
    console.error("Error getting product by id:", error);
    res.status(500).json({ message: "Failed to get product by id" });
  }
};

// post product -> add product
export const createProduct: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    console.log('Files Recieved:', req.files);
    console.log('Body Recieved:', req.body);
    const {
      category,
      productName,
      productPrice,
      productStock,
      productSize,
      productDescription,
      isActive,
    } = req.body;

    const files = req.files as {
      [field:string]: Express.Multer.File[];
    }

    const mainImageFile = files?.productImage?.[0];
    const thumbnailImagesFiles = files?.productThumbnailImages;

    // Field‑level validation
    const errors: Record<string, string> = {};

    if (!category || String(category).trim() === "") {
      errors.category = "Category is required";
    }

    if (!productName || String(productName).trim() === "") {
      errors.productName = "Product name is required";
    }

    if(!productSize || isNaN(Number(productSize))) {
      errors.productSize = "Product size is required and must be a number";
    }

    if (
      productPrice === undefined ||
      productPrice === null ||
      isNaN(Number(productPrice))
    ) {
      errors.productPrice = "Product price is required and must be a number";
    }

    if (!mainImageFile) {
      errors.productImage = "Main product image is required";
    }

    if (!thumbnailImagesFiles || thumbnailImagesFiles.length === 0) {
      errors.productThumbnailImages = "At least one thumbnail image is required";
    }

    if (
      productStock === undefined ||
      productStock === null ||
      isNaN(Number(productStock))
    ) {
      errors.productStock = "Product stock is required and must be a number";
    }

    if (!productDescription || String(productDescription).trim() === "") {
      errors.productDescription = "Product description is required";
    }

    if (Object.keys(errors).length > 0) {
      res.status(400).json({
        message: "Validation error",
        errors,
      });
      return;
    }

    
    const productImageUrl = await uploadBufferToCloudinary(
      mainImageFile!.buffer,
      "products/main"
    );
    const thumnailUrls = await Promise.all(
      thumbnailImagesFiles!.map(file => 
        uploadBufferToCloudinary(file.buffer, 'products/thumbnails')
      )
    )

    const product = new Product({
      category,
      productName,
      productPrice,
      productImage:productImageUrl,
      productThumbnailImages:thumnailUrls,
      productStock,
      productSize,
      productDescription,
      isActive: isActive ==  "true",
    });

    const saved = await product.save();
    res.status(201).json({
      message: "Product created successfully",
      product: saved,
    });
  } catch (error: any) {
    console.error("Error creating product:", error);
    res.status(500).json({
      message: "Failed to create product",
      error: error?.message || error,
     });
  }
};

// put product -> update product
export const updateProduct: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const files = req.files as {
      [filed: string]: Express.Multer.File[]
    };
    const newThumbnailFiles = files?.productThumbnailImages || [];

    const newThumbnailUrl = await Promise.all(
      newThumbnailFiles.map(file =>
        uploadBufferToCloudinary(file.buffer, 'products/thumbnails')
      )
    );

    let existingThumbnailUrls = req.body.productThumbnailImages || [];
    if (!Array.isArray(existingThumbnailUrls)) {
      existingThumbnailUrls = [existingThumbnailUrls];
    }

    //handling the main image
    let mainImageUrl = req.body.productImage;
    if (files?.productImage?.[0]) { 
      mainImageUrl = await uploadBufferToCloudinary(
        files.productImage[0].buffer,
        'products/main'
      );
    }

    const allThumbnailUrls = [...existingThumbnailUrls, ...newThumbnailUrl];

    const updateData = {
      ...req.body,
      productImage: mainImageUrl,
      productThumbnailImages: allThumbnailUrls
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!updated) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(200).json({
      message: "Product updated successfully",
      product: updated,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Failed to update product" });
  }
};

//delete product -> delete product
export const deleteProduct: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(200).json({
      message: "Product deleted successfully",
      product: deleted,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};
