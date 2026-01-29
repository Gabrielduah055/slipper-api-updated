import mongoose from "mongoose";

const connetDB = async () => {
  try {
    const conn = await mongoose.connect(
      `${process.env.MONGODB_URI}slipper-api`
    );
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

mongoose.connection.on("connected", () => {
  console.log("Admin Database connected successfully");
});

mongoose.connection.on("error", (error) => {
  console.error("Mongoose connection error:", error);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from DB");
});

export default connetDB;
