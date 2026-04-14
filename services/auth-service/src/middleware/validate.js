import { ZodError } from 'zod';
import logger from '#config/logger';

const validate = (schema) => (req, res, next) => {
  try {
    // Debug: Let's see what is coming in
    if (!req.body || Object.keys(req.body).length === 0) {
      logger.warn('Incoming request has no body. Make sure Content-Type is application/json');
    }

    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    return next();
  } catch (error) {
    // If it's a Zod Error, it will have 'issues'
    if (error instanceof ZodError || error.issues) {
      const issues = error.issues || error.errors; // Try both to be safe
      
      const errorMessage = issues.map((iss) => iss.message).join(', ');
      logger.warn(`Validation Failed: ${errorMessage}`);

      return res.status(400).json({
        status: 'fail',
        errors: issues.map((iss) => ({
          field: iss.path.join('.'),
          message: iss.message
        })),
      });
    }

    // If it's not a Zod error, log the whole thing so we can see it
    logger.error('Unexpected Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export default validate;