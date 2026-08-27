'use strict';

const { z } = require('zod');
const { HttpError } = require('./errors');

/**
 * validate({ body?: schema, query?: schema, params?: schema })
 * Parsed values are stored on req.valid[source]; req.body is replaced with the
 * parsed body. (Express 5 exposes req.query as a getter, so it is not reassigned.)
 */
function validate(schemas) {
  return (req, res, next) => {
    req.valid = req.valid || {};
    for (const [source, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(req[source] ?? {});
      if (!result.success) {
        return next(
          new HttpError(400, 'Validation failed', {
            code: 'VALIDATION',
            details: z.flattenError(result.error),
          }),
        );
      }
      req.valid[source] = result.data;
      if (source === 'body') req.body = result.data;
    }
    return next();
  };
}

module.exports = { validate };
