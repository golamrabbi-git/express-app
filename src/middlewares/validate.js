import AppError from '../utils/AppError.js';

// Turns Zod issues into [{ field, message }], keeping only the first message per field.
const toDetails = (issues) => {
  const seen = new Map();
  for (const issue of issues) {
    const field = issue.path.length ? issue.path.join('.') : 'body';
    if (!seen.has(field)) seen.set(field, { field, message: issue.message });
  }
  return [...seen.values()];
};

// validate({ body, query }) parses each part with its Zod schema.
// The parsed (trimmed, defaulted, unknown-keys-stripped) body replaces req.body;
// the parsed query goes on req.validatedQuery, because req.query is read-only in Express 5.
export const validate =
  ({ body, query }) =>
  (req, res, next) => {
    if (body) {
      const result = body.safeParse(req.body ?? {});
      if (!result.success) return next(new AppError(400, 'Validation failed', toDetails(result.error.issues)));
      req.body = result.data;
    }
    if (query) {
      const result = query.safeParse(req.query ?? {});
      if (!result.success) return next(new AppError(400, 'Validation failed', toDetails(result.error.issues)));
      req.validatedQuery = result.data;
    }
    return next();
  };
