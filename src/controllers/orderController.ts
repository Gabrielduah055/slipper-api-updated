import { Request, Response, RequestHandler } from "express";
import Order from "../models/OrderSchema";
import Customer from "../models/CustomerSchema";
import Product from "../models/ProductSchema";
import { ICustomer } from "../interface/customerInterface";
import { IProduct } from "../interface/productInterface";
import { sendOrderNotificationEmail } from "../utils/emailService";

// Create new order
export const createOrder: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { 
        firstName, 
        lastName, 
        email, 
        phoneNumber, 
        address,
        items 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Order must contain at least one item" });
        return;
    }

    // 1. Handle Customer (Find or Create)
    let customer = await Customer.findOne({ email });
    
    if (customer) {
        // Update existing customer details if provided
        customer.firstName = firstName || customer.firstName;
        customer.lastName = lastName || customer.lastName;
        customer.phoneNumber = phoneNumber || customer.phoneNumber;
        customer.address = address || customer.address;
        await customer.save();
    } else {
        // Create new customer
        if (!firstName || !lastName || !email || !phoneNumber) {
            res.status(400).json({ message: "New customer details required" });
            return;
        }
        customer = await Customer.create({
            firstName,
            lastName,
            email,
            phoneNumber,
            address
        });
    }

    // 2. Validate Products and Calculate Total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        const product = await Product.findById(item.product);
        
        if (!product) {
            res.status(404).json({ message: `Product with ID ${item.product} not found` });
            return;
        }

        if (product.productStock < item.quantity) {
            res.status(400).json({ message: `Insufficient stock for product: ${product.productName}` });
            return;
        }

        orderItems.push({
            product: item.product,
            quantity: item.quantity,
            priceAtPurchase: product.productPrice
        });

        totalAmount += product.productPrice * item.quantity;
    }

    // 3. Create Order
    const order = new Order({
        customer: customer._id,
        items: orderItems,
        totalAmount,
        status: 'pending',
        paymentInfo: {
            method: 'mock',
            status: 'paid', // Assuming mock payment is successful
            transactionId: `MOCK-${Date.now()}`
        }
    });

    const savedOrder = await order.save();

    // 4. Update Product Stock
    for (const item of orderItems) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { productStock: -item.quantity }
        });
    }

    // 5. Send Notifications
    // Real-time notification via Socket.io
    const io = req.app.get('io');
    if (io) {
        io.emit('newOrder', {
            orderId: savedOrder._id,
            amount: savedOrder.totalAmount,
            customerName: `${customer.firstName} ${customer.lastName}`,
            createdAt: savedOrder.createdAt
        });
    }

    // Email notification
    await sendOrderNotificationEmail(savedOrder, customer);

    res.status(201).json({
        message: "Order placed successfully",
        order: savedOrder,
        customer: customer
    });

  } catch (error: any) {
    console.error("Error creating order:", error);
    res.status(500).json({
      message: "Failed to create order",
      error: error?.message || error,
    });
  }
};

// Get all orders
export const getAllOrders: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
        .populate('customer')
        .populate('items.product')
        .sort({ createdAt: -1 });
        
    res.status(200).json({
      message: "Orders fetched successfully",
      orders: orders,
    });
  } catch (error) {
    console.error("Error getting all orders:", error);
    res.status(500).json({ message: "Failed to get all orders" });
  }
};

// Get order by ID
export const getOrderById: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
        .populate('customer')
        .populate('items.product');

    if (!order) {
      res.status(404).json({ message: "Order not found" });
      return;
    }
    res.status(200).json({
      message: "Order fetched successfully",
      order: order,
    });
  } catch (error) {
    console.error("Error getting order by id:", error);
    res.status(500).json({ message: "Failed to get order by id" });
  }
};

// Update order status
export const updateOrderStatus: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
    ).populate('customer').populate('items.product');

    if (!updatedOrder) {
      res.status(404).json({ message: "Order not found" });
      return;
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
