import { db } from "../db.js";
import bcrypt from "bcrypt";

export const registerCustomer = async (req, res) => {
  try {
    const { name, phone, email, location, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const customer = await db
      .collection("customers")
      .insertOne({ name, phone, email, location, password: hashPassword });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: "Failed to register customer" });
  }
};

export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    const customer = await db.collection("customers").findOne({ email: email });
    if (!customer) {
      return res
        .status(403)
        .json({ status: "failed", Message: "Register first" });
    } else {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res
          .status(201)
          .json({ status: "success", message: "Login Successfully.." });
      } else {
        return res
          .status(401)
          .json({ status: "failed", message: "Check the credentials" });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to login " });
  }
};
