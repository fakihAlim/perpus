import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "perpusecretkey2026";

export function signToken(payload: { userId: number; email: string; role: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET) as { userId: number; email: string; role: string };
  } catch (error) {
    return null;
  }
}
