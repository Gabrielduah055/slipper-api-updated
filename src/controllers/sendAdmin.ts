import Admin from "../models/AdminSchema";
import connetDB from "../config/mongodb";
import dotenv from "dotenv";

dotenv.config();

//creating an admin inside the database
const createAdmin = async () => {
  try {
    console.log("creating admin");
    await connetDB();

    //check if member already exists
    const existingAdmin = await Admin.findOne({
      email: "gabrielagyemanduah@gmail.com",
    });
    if (existingAdmin) {
        console.log("admin already exists");
      return;
    }

    const newAdmin = new Admin({
      userName: "Gabriel Agyeman Duah",
      email: "gabrielagyemanduah@gmail.com",
      password: "Gabbyduah055$",
      role: "admin",
    });
    await newAdmin.save();
    console.log("Admin created successfully");
  } catch (error) {
    console.log("error creating admin", error);
  }
};

createAdmin();
