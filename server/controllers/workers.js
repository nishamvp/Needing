import { db } from "../db.js";
import bcrypt from "bcrypt";
import {
  generateEmailToken,
  generateToken,
  verifyEmail,
  generateAccessToken,
} from "../jwt/jwt.js";
import nodemailer from "nodemailer";
import { WORKERS_COLLECTION, VERIFY_WORKER_URL } from "../constants.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const registerWorker = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!email || !password || !name)
      return res
        .status(401)
        .json({ status: "Failed", message: "No credential given" });
    const isUserExist = await db
      .collection(WORKERS_COLLECTION)
      .findOne({ email });
    if (isUserExist)
      return res
        .status(403)
        .json({ status: "failed", Message: "User already exist" });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const createUser = await db
      .collection(WORKERS_COLLECTION)
      .insertOne({ name, email, password: hashPassword });
    const user = await db
      .collection(WORKERS_COLLECTION)
      .findOne({ _id: createUser.insertedId });
    const emailToken = await generateEmailToken({
      email: email,
      role: "worker",
    });
    const verificationUrl = VERIFY_WORKER_URL + emailToken;
    const mailOptions = {
      from: "nishamvp30@gmail.com",
      to: user.email,
      subject: "Verify your email",
      html: `Please click the following link to verify your email: <a href=${verificationUrl}>${verificationUrl}</a>`,
    };
    await transporter.sendMail(mailOptions);
    res.status(201).json(createUser);
  } catch (error) {
    res.status(500).json({ message: "Failed to register customer" });
  }
};

export const WorkerEmailVerification = async (req, res) => {
  const token = req.params.token;
  try {
    const { err, decoded } = await verifyEmail(token);

    if (err) {
      return res.status(403).json({
        status: "failed",
        message: "Something went wrong with the verification",
      });
    } else {
      const user = await db
        .collection(WORKERS_COLLECTION)
        .findOne({ email: decoded.email });
      const verifyingUser = await db
        .collection(WORKERS_COLLECTION)
        .updateOne({ _id: user._id }, { $set: { verified: true } });
      return res.status(200).json({
        status: "success",
        message: "Email verified successfully",
        verifyingUser,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

export const loginWorker = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password)
      return res
        .status(401)
        .json({ status: "Failed", message: "No credential given" });
    const customer = await db
      .collection(WORKERS_COLLECTION)
      .findOne({ email: email });
    if (!customer) {
      return res
        .status(403)
        .json({ status: "failed", Message: "Register first" });
    } else {
      const isMatch = await bcrypt.compare(password, customer.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ status: "failed", message: "Check the credentials" });
      } else {
        const token = await generateToken({
          email: customer.email,
          role: "customer",
        });

        const accessToken = await generateAccessToken({
          email: customer.email,
          role: "customer",
        });

        const options = {
          maxAge: 1000 * 60 * 15, // 15 minutes
          httpOnly: true,
          sameSite: "none", // Adjust according to your needs
          secure: process.env.NODE_ENV === "production", // Use secure cookies only in production
        };

        // Set the token as a cookie
        res.cookie("token", token, options);

        // Set the access token in the response header
        res.setHeader("Access-Token", accessToken);

        return res.status(201).json({
          status: "success",
          message: "Login successfully",
        });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to login " });
  }
};
