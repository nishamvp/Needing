import express from "express";
import { emailVerification, loginCustomer, refreshToken, registerCustomer,  } from "../controllers/customers.js";

const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer); 
router.post("/refresh-token", refreshToken); 
router.get("/verify-email/:token", emailVerification);

export default router;
