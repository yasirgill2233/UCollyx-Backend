const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Saare errors ko ek saath collect karega
      stripUnknown: true // Extra undefined fields ko payload se remove karega
    });

    if (error) {
      // Tamam errors ko map karke ek clean array ya object banate hain
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

    // Sanitize data req.body mein assign karein
    req.body = value;
    next();
  };
};

module.exports = validate;