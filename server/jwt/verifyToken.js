import jwt from 'jsonwebtoken';

export const verifyAccessToken = async (req, res, next) => {
  const accessToken = req.headers['access-token'];
  const refreshToken = req.cookies.token

  if (!accessToken ) {
    return res.status(401).json({ message: 'Access token is missing' });
  }

  try {
    // Verify the access token
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET_KEY);

    // Attach the decoded user information to the request object
    req.user = decoded;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error('Access token verification failed:', error);
    return res.status(401).json({ message: 'Invalid access token' });
  }
};
