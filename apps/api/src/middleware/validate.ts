import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ValidationError } from "../utils/errors";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten();
      throw new ValidationError(
        "Validation failed",
        JSON.stringify(details.fieldErrors),
      );
    }
    req.body = result.data;
    next();
  };
}
