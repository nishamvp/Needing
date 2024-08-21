import express from "express";
import {
  addProfile,
  addServices,
  loginWorker,
  registerWorker,
  WorkerEmailVerification,
} from "../controllers/workers.js";
import { verifyAccessToken } from "../jwt/jwt.js";

const router = express.Router();

router.post("/register", registerWorker);
router.post("/login", loginWorker);
router.get("/verify-email/:token", WorkerEmailVerification);
router.post("/add-service", verifyAccessToken, addServices);
router.post("/add-profile", verifyAccessToken, addProfile);

export default router;
