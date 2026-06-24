const Joi = require('joi');

const registerSchema = Joi.object({
  full_name: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .required()
    .pattern(/[a-zA-Z][a-zA-Z0-9-_]*$/) // Sirf alphabets aur spaces allowed hain
    .messages({
      'string.empty': 'Full name cannot be empty',
      'string.min': 'Full name must be at least 3 characters long',
      'string.max': 'Full name cannot exceed 50 characters',
      'string.pattern.base': 'Full name can only contain letters and spaces',
      'any.required': 'Full name is required'
    }),

  email: Joi.string()
    .email({ minDomainSegments: 2 }) // Ensure proper tld like .com, .org
    .trim()
    .lowercase() // Automatic email ko lowercase kar dega
    .required()
    .messages({
      'string.empty': 'Email cannot be empty',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),

  password: Joi.string()
    .min(8)
    .max(32)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/) // Strong password regex
    .messages({
      'string.empty': 'Password cannot be empty',
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password cannot exceed 32 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
});

module.exports = {
  registerSchema
};