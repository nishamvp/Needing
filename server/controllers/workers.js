import { db } from "../db.js";
import bcrypt from "bcrypt";
import {
  generateEmailToken,
  generateToken,
  verifyEmail,
  generateAccessToken,
} from "../jwt/jwt.js";
import nodemailer from "nodemailer";
import {
  WORKERS_COLLECTION,
  VERIFY_WORKER_URL,
  WORKERS_SERVICES_COLLECTION,
  LOCATION_COLLECTION,
} from "../constants.js";

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
    res.status(500).json({ message: "Failed to register worker" });
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
    const worker = await db
      .collection(WORKERS_COLLECTION)
      .findOne({ email: email });
    if (!worker) {
      return res
        .status(403)
        .json({ status: "failed", Message: "Register first" });
    } else {
      const isMatch = await bcrypt.compare(password, worker.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ status: "failed", message: "Check the credentials" });
      } else {
        const token = await generateToken({
          email: worker.email,
          role: "worker",
        });

        const accessToken = await generateAccessToken({
          email: worker.email,
          role: "worker",
        });

        const options = {
          httpOnly: true,
          sameSite: "Lax", // Adjust according to your needs
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

export const addServices = async (req, res) => {
  const { serviceTitle, description, experience, payment } = req.body;
  try {
    if (!serviceTitle || !description || !experience || !payment)
      return res
        .status(400)
        .json({ message: "Credentials are not given", status: "failed" });
    const worker = await db
      .collection(WORKERS_COLLECTION)
      .findOne({ email: req.user.email });
    const addService = await db
      .collection(WORKERS_SERVICES_COLLECTION)
      .insertOne({
        serviceTitle,
        description,
        experience,
        payment,
        workerId: worker._id,
        location: worker.location,
      });
    return res.status(201).json({
      status: "success",
      message: "Service added successfully",
      service: addService,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", status: "failed" });
  }
};

export const addProfile = async (req, res) => {
  const { location, services } = req.body;
  const { email } = req.user;

  try {
    // Get workerId using the user object
    const worker = await db.collection(WORKERS_COLLECTION).findOne({ email });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }

    const workerId = worker._id.toString();

    // Add location to the Location collection
    await db.collection(LOCATION_COLLECTION).insertOne({
      workerId,
      coordinates: [location.longitude, location.latitude],
    });

    // Add services to the Workers Services collection
    await db.collection(WORKERS_SERVICES_COLLECTION).insertMany(
      services.map((service) => ({
        ...service,
        workerId,
      }))
    );

    // Send a success response
    return res.status(201).json({ message: 'Profile added successfully' });
  } catch (error) {
    console.error('Error adding profile:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

