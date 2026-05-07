const rateLimit = require('express-rate-limit');

// 1. General API Rate Limiter (Sari normal requests ke liye)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes ka window time
  max: 100, // Har IP address se 15 mins mein maximum 100 requests allow hongi
  standardHeaders: true, // `RateLimit-*` headers return karega
  legacyHeaders: false, // `X-RateLimit-*` headers ko disable karega
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
    errors: [{ field: "rate_limit", message: "Request limit exceeded" }]
  },
  statusCode: 429, // Too Many Requests status code
});

// 2. Strict Rate Limiter (Auth aur sensitive routes ke liye jaise login/create project)
const strictLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute ka window time
  max: 10, // Har IP address se 1 minute mein maximum 10 requests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many attempts. Please slow down and try again after a minute.",
    errors: [{ field: "rate_limit", message: "Too many requests" }]
  },
  statusCode: 429,
});

module.exports = {
  apiLimiter,
  strictLimiter
};