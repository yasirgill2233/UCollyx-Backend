const Joi = require('joi');

const createChannelSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .trim()
    .required()
    .pattern(/^[a-zA-Z][a-zA-Z0-9-_]*$/) // Sirf letters, numbers, hyphens (-) aur underscores (_) allowed hain
    .lowercase() // Slack/Discord ki tarah channels ko lowercase rakhna behtar rehta hai
    .messages({
      'string.empty': 'Channel name cannot be empty',
      'string.min': 'Channel name must be at least 3 characters long',
      'string.max': 'Channel name cannot exceed 50 characters',
      'string.pattern.base': 'Channel name must start with a letter and can only contain letters, numbers, hyphens (-), and underscores (_)',
      'any.required': 'Channel name is a required field',
    }),

  description: Joi.string()
    .max(250)
    .trim()
    .allow('', null) // Description optional hai (empty string ya null dono chalenge)
    .messages({
      'string.max': 'Description cannot exceed 250 characters'
    }),

});

module.exports = {
  createChannelSchema
};