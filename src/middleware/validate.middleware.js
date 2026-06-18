const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message.replace(/['"]/g, '')
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: errorMessages
      });
    }

    req.body = value;
    next();
  };
};

module.exports = validate;