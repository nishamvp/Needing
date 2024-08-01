import express from "express";
import { loginCustomer, registerCustomer } from "../controllers/customers.js";

const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

export default router;
