import jwt from "jsonwebtoken";

export const generateToken = async (user) => {
  const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
  return token;
};

export const generateEmailToken = async (email) => {
  const token = jwt.sign({ email }, process.env.EMAIL_SECRET_KEY, {
    expiresIn: "1h",
  });
  return token;
};

export const verifyEmail = async (token) => {
  const verify = await jwt.verify(token, process.env.EMAIL_SECRET_KEY, (err, decoded) => {
    return {err,decoded};
  });
  return verify
};
