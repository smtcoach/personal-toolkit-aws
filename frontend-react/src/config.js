export function getAppConfig() {
  const appConfig = window.APP_CONFIG || {};
  return {
    apiUrl: (appConfig.API_URL || "").replace(/\/$/, ""),
    legacyApiUrl: (appConfig.LEGACY_API_URL || appConfig.API_URL || "").replace(/\/$/, ""),
    awsRegion: appConfig.AWS_REGION || "us-east-2",
    cognitoDomain: (appConfig.COGNITO_DOMAIN || "").replace(/\/$/, ""),
    cognitoClientId: appConfig.COGNITO_CLIENT_ID || "",
    cognitoRedirectUri:
      appConfig.COGNITO_REDIRECT_URI || window.location.origin + window.location.pathname,
    cognitoLogoutUri:
      appConfig.COGNITO_LOGOUT_URI || window.location.origin + window.location.pathname,
    cognitoScopes: Array.isArray(appConfig.COGNITO_SCOPES)
      ? appConfig.COGNITO_SCOPES
      : ["openid", "email", "profile"]
  };
}
