export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 400, details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class ParseError extends AppError {
  constructor(
    message: string = "Failed to parse AI response",
    public readonly rawResponse?: string,
  ) {
    super(message, 502, rawResponse?.substring(0, 500));
    this.name = "ParseError";
  }
}
