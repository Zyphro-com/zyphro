// client/src/apiConfig.js

const isLocal = window.location.hostname === 'localhost';

export const API_URL = isLocal 
  ? 'http://localhost:3000'
  : 'https://zyphro.com'; 

console.log(`[Zyphro System] Modo: ${isLocal ? 'LOCAL' : 'PRODUCCIÓN'}`);