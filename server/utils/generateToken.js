import jwt from "jsonwebtoken";

export default function generateToken(userId, extraPayload = {}) {
  const payload = { id: userId, ...extraPayload };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
}
