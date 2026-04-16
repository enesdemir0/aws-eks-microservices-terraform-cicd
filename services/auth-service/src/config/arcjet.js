import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';
import config from '#config/index';

const aj = arcjet({
  key: config.arcjetKey || 'ajkey_placeholder',
  characteristics: ['ip.src'],
  rules: [
    // Protect against common attacks (SQLi, XSS, etc.)
    shield({ mode: 'LIVE' }),
    // Block automated bots from hitting auth endpoints
    detectBot({ mode: 'LIVE', allow: [] }),
    // 20 requests per minute per IP on auth endpoints
    slidingWindow({ mode: 'LIVE', interval: '1m', max: 20 }),
  ],
});

export default aj;
