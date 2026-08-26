import type { Request, RequestHandler } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { config } from "./config.js";

export interface UserRequest extends Request {
  userId?: string;
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognitoUserPoolId,
  clientId: config.cognitoClientId,
  tokenUse: "access"
});

export const authenticate: RequestHandler = async (req, res, next) => {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    res.status(401).json({ message: "Please sign in" });
    return;
  }

  try {
    const payload = await verifier.verify(token);
    (req as UserRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ message: "Your access token is invalid or expired" });
  }
};
