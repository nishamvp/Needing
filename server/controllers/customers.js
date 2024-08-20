import { db } from "../db.js";
import bcrypt from "bcrypt";
import {
  generateEmailToken,
  generateToken,
  verifyEmail,
  generateAccessToken,
  verifyRefreshToken,
} from "../jwt/jwt.js";
import nodemailer from "nodemailer";
import {
  CUSTOMER_COLLECTION,
  VERIFY_CUSTOMER_URL,
  WORKERS_COLLECTION,
  WORKERS_SERVICES_COLLECTION,
} from "../constants.js";
import { ObjectId } from "mongodb";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const registerCustomer = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    if (!email || !password || !name)
      return res
        .status(401)
        .json({ status: "Failed", message: "No credential given" });
    const isUserExist = await db
      .collection(CUSTOMER_COLLECTION)
      .findOne({ email });
    if (isUserExist)
      return res
        .status(403)
        .json({ status: "failed", Message: "User already exist" });

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const createUser = await db
      .collection(CUSTOMER_COLLECTION)
      .insertOne({ name, email, password: hashPassword });
    const user = await db
      .collection(CUSTOMER_COLLECTION)
      .findOne({ _id: createUser.insertedId });
    const emailToken = await generateEmailToken({
      email: email,
      role: "customer",
    });
    const verificationUrl = VERIFY_CUSTOMER_URL + emailToken;
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

export const emailVerification = async (req, res) => {
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
        .collection(CUSTOMER_COLLECTION)
        .findOne({ email: decoded.email });
      const verifyingUser = await db
        .collection(CUSTOMER_COLLECTION)
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

export const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(401)
        .json({ status: "Failed", message: "No credential given" });
    const customer = await db
      .collection(CUSTOMER_COLLECTION)
      .findOne({ email: email });

    if (!customer) {
      return res
        .status(403)
        .json({ status: "failed", message: "Register first" });
    }

    const isMatch = await bcrypt.compare(password, customer.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "failed", message: "Check the credentials" });
    }

    const token = await generateToken({
      email: customer.email,
      role: "customer",
    });

    const accessToken = await generateAccessToken({
      email: customer.email,
      role: "customer",
    });

    const options = {
      httpOnly: true,
      sameSite: "Lax", // Adjust according to your needs
      secure: process.env.NODE_ENV === "production", // Use secure cookies only in production
    };

    // Set the token as a cookie
    res.cookie("token", token, options);

    // Set the access token in the response header
    res.setHeader("access-Token", accessToken);

    return res.status(201).json({
      status: "success",
      message: "Login successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Failed to login" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.token;

    // Check if refresh token exists
    if (!refreshToken) {
      return res
        .status(401)
        .json({ status: "failed", message: "No token found" });
    }

    // Verify the refresh token
    const { err, decoded } = await verifyRefreshToken(refreshToken);

    if (err) {
      return res
        .status(401)
        .json({ status: "failed", message: "Invalid token" });
    }

    // Find the customer associated with the token
    const customer = await db
      .collection(CUSTOMER_COLLECTION)
      .findOne({ email: decoded.email });

    if (!customer) {
      return res
        .status(404)
        .json({ status: "failed", message: "Customer not found" });
    }

    // Generate a new access token
    const newAccessToken = await generateAccessToken({
      email: customer.email,
      role: "customer",
    });

    // Set the new access token in the response header
    res.setHeader("access-token", newAccessToken);

    // Send a successful response
    return res
      .status(200)
      .json({ status: "success", message: "Access token refreshed" });
  } catch (error) {
    return res
      .status(500)
      .json({ status: "error", message: "Refresh-token expired" });
  }
};

export const getServices = async (req, res) => {
  const { email } = req.user;

  try {
    // Find the customer by email
    const customer = await db
      .collection(CUSTOMER_COLLECTION)
      .findOne({ email });

    if (!customer) {
      return res
        .status(404)
        .json({ status: "error", message: "Customer not found" });
    }

    // Find workers in the same location as the customer
    const workersInLocation = await db
      .collection(WORKERS_COLLECTION)
      .find({ location: customer.location })
      .toArray(); // Convert cursor to array

    // Find services using the workerIds
    const workerIds = workersInLocation.map((worker) => worker._id.toString());
    console.log(workerIds)
    const services = await db
      .collection(WORKERS_SERVICES_COLLECTION)
      .find({
        workerId: { $in: workerIds },
      })
      .toArray();
      // console.log(services)

    // Return the found services to the client
    return res.status(200).json({ status: "success", services });
  } catch (error) {
    console.error("Error retrieving services:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};
