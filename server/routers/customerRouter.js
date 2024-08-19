import express from "express";
import { emailVerification, getServices, loginCustomer, refreshToken, registerCustomer,  } from "../controllers/customers.js";
import { verifyAccessToken } from "../jwt/jwt.js";

const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer); 
router.post("/refresh-token", refreshToken); 
router.get("/verify-email/:token", emailVerification);
router.get("/get-services",verifyAccessToken ,getServices);

export default router;
