const isLocalDevelopment = ["localhost", "127.0.0.1"].includes(window.location.hostname);

window.APP_CONFIG = {
  API_URL: isLocalDevelopment
    ? "http://localhost:3000/api/v1"
    : window.location.origin + "/api/v1",
  AWS_REGION: "us-east-2",
  COGNITO_DOMAIN: "https://personal-toolkit-844641713466-us-east-2.auth.us-east-2.amazoncognito.com",
  COGNITO_CLIENT_ID: "62nbd5t1j78c6n8bjici33lgdj",
  COGNITO_REDIRECT_URI: window.location.origin + window.location.pathname,
  COGNITO_LOGOUT_URI: window.location.origin + window.location.pathname,
  COGNITO_SCOPES: ["openid", "email", "profile"]
};
