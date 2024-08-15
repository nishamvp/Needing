import jwt from "jsonwebtoken";

export const generateToken = async (user) => {
  const token = jwt.sign(user, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
  return token;
};
export const generateAccessToken = async (user) => {
  const token = jwt.sign(user, process.env.JWT_ACCESS_SECRET_KEY, {
    expiresIn: "15m",
  });
  return token;
};

export const generateEmailToken = async (emailUser) => {
  const token = jwt.sign(emailUser, process.env.EMAIL_SECRET_KEY, {
    expiresIn: "1h",
  });
  return token;
};

export const verifyEmail = async (token) => {
  const verify = await jwt.verify(
    token,
    process.env.EMAIL_SECRET_KEY,
    (err, decoded) => {
      return { err, decoded };
    }
  );
  return verify;
};

export const verifyAccessToken = async (req, res, next) => {
  const accessToken = req.headers["access-token"];
  
  if (!accessToken ) {
    return res.status(401).json({ message: "There is no token provided" });
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY);

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Access token verification failed:", error);
    return res.status(401).json({ message: "Invalid access token" });
  }
};

export const verifyRefreshToken = async (token) => {
  const verify = await jwt.verify(
    token,
    process.env.JWT_SECRET_KEY,
    (err, decoded) => {
      return { err, decoded };
    }
  );
};
