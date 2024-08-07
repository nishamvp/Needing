import express from "express"
import { loginWorker, registerWorker, WorkerEmailVerification } from "../controllers/workers.js";


const router = express.Router()

router.post("/register", registerWorker);
router.post("/login", loginWorker);
router.get("/verify-email/:token", WorkerEmailVerification);

export default router