import { Router } from "express";
import { loginAdmin } from "../controllers/loginAdmin";


const adminRouter = Router();

//post route to login
adminRouter.post("/login", loginAdmin);


export default adminRouter;