import express from "express";
import { emailVerification, loginCustomer, registerCustomer,  } from "../controllers/customers.js";

const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.get("/verify-email/:token", emailVerification);

export default router;
