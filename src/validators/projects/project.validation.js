const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .trim()
    .required()
    .pattern(/^(?!\d+$).+$/)
    .messages({
      'string.empty': 'Project name cannot be empty',
      'string.min': 'Project name should have at least 3 characters',
      'any.required': 'Project name is a required field',
      'string.pattern.base': 'Project name cannot be just a number',
    }),

  description: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),

  status: Joi.string()
    .valid('ACTIVE', 'PAUSED', 'ARCHIVED')
    .default('ACTIVE')
    .messages({
      'any.only': 'Status must be either ACTIVE, PAUSED, or ARCHIVED'
    }),

  manager_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Manager ID must be a valid number'
    }),

  createChannel: Joi.boolean()
    .default(true)
});

module.exports = {
  createProjectSchema
};