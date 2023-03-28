class APIError extends Error {
  type: string;
  status: number;
}

export function isAPIError(err: any): err is APIError {
  if (typeof err?.status !== "number") {
    return false;
  }
  const st = err.status;
  return st % 1 === 0 && st >= 400 && st < 600;
}

export class BadRequestError extends APIError {
  constructor(message) {
    super(message);
    this.type = "BadRequestError";
    this.status = 400;
  }
}

export class NotFoundError extends APIError {
  constructor(message) {
    super(message);
    this.type = "NotFoundError";
    this.status = 404;
  }
}

export class UnauthorizedError extends APIError {
  constructor(message) {
    super(message);
    this.type = "UnauthorizedError";
    this.status = 401;
  }
}

export class ForbiddenError extends APIError {
  constructor(message) {
    super(message);
    this.type = "ForbiddenError";
    this.status = 403;
  }
}

export class UnprocessableEntityError extends APIError {
  constructor(message) {
    super(message);
    this.type = "UnprocessableEntityError";
    this.status = 422;
  }
}

export class TooManyRequestsError extends APIError {
  constructor(message) {
    super(message);
    this.type = "TooManyRequestsError";
    this.status = 429;
  }
}

export class InternalServerError extends APIError {
  constructor(message) {
    super(message);
    this.type = "InternalServerError";
    this.status = 500;
  }
}

export class NotImplementedError extends APIError {
  constructor(message) {
    super(message);
    this.type = "NotImplementedError";
    this.status = 501;
  }
}

export class BadGatewayError extends APIError {
  constructor(message) {
    super(message);
    this.type = "BadGatewayError";
    this.status = 502;
  }
}
