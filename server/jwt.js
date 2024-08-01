import jwt from "jsonwebtoken";


export const generateToken = async (user) => {
  const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });
  return token
};
