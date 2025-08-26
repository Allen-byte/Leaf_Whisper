// src/config/env.js
const SERVER_IP = "x.x.x.x";

export const SERVER_BASE_URL = __DEV__
  ? `http://${SERVER_IP}:3000`
  : 'https://your-production-server.com';
