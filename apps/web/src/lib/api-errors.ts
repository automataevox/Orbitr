/**
 * API Error Handler
 * Centralized error handling for API routes
 */

import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    // Docker errors
    if (error.message.includes("ENOENT") || error.message.includes("connect EACCES")) {
      return NextResponse.json(
        {
          error: "Unable to connect to Docker. Please ensure Docker is running.",
          code: "DOCKER_CONNECTION_ERROR",
        },
        { status: 503 }
      );
    }

    // Network errors
    if (error.message.includes("ECONNREFUSED") || error.message.includes("ETIMEDOUT")) {
      return NextResponse.json(
        {
          error: "Connection failed. Please check your network connection.",
          code: "NETWORK_ERROR",
        },
        { status: 503 }
      );
    }

    // Permission errors
    if (error.message.includes("EACCES") || error.message.includes("permission denied")) {
      return NextResponse.json(
        {
          error: "Permission denied. Please check your permissions.",
          code: "PERMISSION_ERROR",
        },
        { status: 403 }
      );
    }

    // Validation errors
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return NextResponse.json(
        {
          error: error.message,
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: error.message,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }

  // Unknown error
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Retry wrapper for operations that may fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Rate limiter for API routes
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  options: {
    maxRequests?: number;
    windowMs?: number;
  } = {}
): boolean {
  const { maxRequests = 100, windowMs = 15 * 60 * 1000 } = options;

  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute
