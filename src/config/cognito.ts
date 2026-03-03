/**
 * AWS Cognito Configuration
 */

export const cognitoConfig = {
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '',
  region: import.meta.env.VITE_COGNITO_REGION || 'eu-west-2',
};

export const isConfigured = (): boolean => {
  return !!(cognitoConfig.userPoolId && cognitoConfig.clientId);
};
