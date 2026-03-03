/**
 * API Configuration
 */

export const apiConfig = {
  baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
};

export const socketConfig = {
  url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
};
