import type { RequestHandler } from "express";
import { CognitoJwtVerifier } from "aws-jwt-verify";
import { config } from "../config.js";
import type { AuthenticatedRequest } from "../types.js";

const verifier = CognitoJwtVerifier.create({
  userPoolId: config.cognitoUserPoolId,
  tokenUse: "access",
  clientId: config.cognitoClientId
});

export const authenticate: RequestHandler = async (req, res, next) => {
  const authorization = req.header("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({
      error: "authentication_required",
      message: "A valid access token is required"
    });
    return;
  }

  try {
    const payload = await verifier.verify(token);
    (req as AuthenticatedRequest).auth = {
      userId: payload.sub,
      username: typeof payload.username === "string" ? payload.username : undefined
    };
    next();
  } catch {
    res.status(401).json({
      error: "invalid_token",
      message: "The access token is invalid or expired"
    });
  }
};
