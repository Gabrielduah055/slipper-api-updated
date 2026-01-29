import { Request, Response, RequestHandler } from "express";
import Customer from "../models/CustomerSchema";

// Get all customers
export const getAllCustomers: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const customers = await Customer.find().sort({
      createdAt: -1,
    });
    res.status(200).json({
      message: "Customers fetched successfully",
      customers: customers,
    });
  } catch (error) {
    console.error("Error getting all customers:", error);
    res.status(500).json({ message: "Failed to get all customers" });
  }
};

// Get customer by id
export const getCustomerById: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);

    if (!customer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }
    res.status(200).json({
      message: "Customer fetched successfully",
      customer: customer,
    });
  } catch (error) {
    console.error("Error getting customer by id:", error);
    res.status(500).json({ message: "Failed to get customer by id" });
  }
};

// Create customer
export const createCustomer: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { firstName, lastName, email, phoneNumber, address } = req.body;

    // Basic validation
    if (!firstName || !lastName || !email || !phoneNumber) {
      res.status(400).json({ message: "All required fields must be provided" });
      return;
    }

    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      res.status(400).json({ message: "Customer with this email already exists" });
      return;
    }

    const customer = new Customer({
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
    });

    const savedCustomer = await customer.save();
    res.status(201).json({
      message: "Customer created successfully",
      customer: savedCustomer,
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    res.status(500).json({
      message: "Failed to create customer",
      error: error?.message || error,
    });
  }
};

// Update customer
export const updateCustomer: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCustomer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ message: "Failed to update customer" });
  }
};

// Delete customer
export const deleteCustomer: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedCustomer = await Customer.findByIdAndDelete(id);

    if (!deletedCustomer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.status(200).json({
      message: "Customer deleted successfully",
      customer: deletedCustomer,
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
};
