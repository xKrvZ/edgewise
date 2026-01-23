import {
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  Injectable,
  Inject,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { BaseExceptionFilter } from "@nestjs/core";
import { ValidationError } from "class-validator";
// import { InjectSentry, SentryService } from '@ntegral/nestjs-sentry';

@Injectable()
@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  public constructor(
    // @InjectSentry() private readonly sentry: SentryService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {
    super();
    // Debug: Verify filter is instantiated
    console.error('[AllExceptionFilter] Filter instantiated');
  }

  /**
   * Formats validation errors into a structured format
   */
  private formatValidationErrors(errors: ValidationError[]): any[] {
    return errors.map((error) => {
      const constraints = error.constraints || {};
      const property = error.property;
      const value = error.value;

      return {
        property,
        value,
        constraints: Object.keys(constraints).map((key) => ({
          type: key,
          message: constraints[key],
        })),
        // Include nested errors if present
        children: error.children?.length
          ? this.formatValidationErrors(error.children)
          : undefined,
      };
    });
  }

  /**
   * Logs 400 errors with request context before they reach the controller
   */
  private logBadRequest(exception: BadRequestException | HttpException, request: Request): void {
    const exceptionResponse = exception.getResponse();
    const isValidationError = 
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse &&
      Array.isArray((exceptionResponse as any).message);

    const logContext: any = {
      method: request.method,
      url: request.url,
      path: request.path,
      query: request.query,
      params: request.params,
      ip: request.ip || request.socket?.remoteAddress,
      userAgent: request.get('user-agent') || 'unknown',
    };

    // Include request body if present (but sanitize sensitive data)
    // Note: body might not be available if ValidationPipe runs before body parsing
    try {
      if (request.body && Object.keys(request.body).length > 0) {
        logContext.body = this.sanitizeRequestBody(request.body);
      }
    } catch (error) {
      // Body might not be parsed yet
      logContext.bodyNote = 'Body not available or not parsed';
    }

    if (isValidationError) {
      const validationErrors = (exceptionResponse as any).message as ValidationError[];
      const formattedErrors = this.formatValidationErrors(validationErrors);
      
      const messages = formattedErrors.flatMap((error) =>
        error.constraints.map((c) => `${error.property}: ${c.message}`),
      );

      // Use error level to ensure it's always visible
      this.logger.error('Validation Error (400 Bad Request)', {
        ...logContext,
        validationErrors: formattedErrors,
        errorMessages: messages,
        exceptionMessage: exception.message,
      });
      
      // Also log as a simple string for visibility
      this.logger.error(
        `[400 Validation Error] ${request.method} ${request.url} - ${messages.join('; ')}`,
      );
    } else {
      // Other BadRequestException (not validation)
      const message = typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as any).message || exception.message
        : exception.message;

      // Use error level to ensure it's always visible
      this.logger.error('Bad Request (400)', {
        ...logContext,
        message: Array.isArray(message) ? message.join('; ') : message,
        exceptionMessage: exception.message,
        exceptionResponse: exceptionResponse,
      });
      
      // Also log as a simple string for visibility
      this.logger.error(
        `[400 Bad Request] ${request.method} ${request.url} - ${Array.isArray(message) ? message.join('; ') : message}`,
      );
    }
  }

  /**
   * Sanitizes request body to remove sensitive information
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie'];
    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    // Recursively sanitize nested objects
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  catch(exception: unknown, host: ArgumentsHost) {
    // Debug: Always log that filter was called
    console.error('[AllExceptionFilter] Exception filter invoked', {
      exceptionType: exception?.constructor?.name || typeof exception,
      isHttpException: exception instanceof HttpException,
      isBadRequest: exception instanceof BadRequestException,
      status: exception instanceof HttpException ? exception.getStatus() : 'N/A',
    });

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Log 400 errors with request context before processing
    if (exception instanceof BadRequestException) {
      console.error('[AllExceptionFilter] BadRequestException detected');
      this.logBadRequest(exception, request);
    } else if (exception instanceof HttpException && exception.getStatus() === 400) {
      console.error('[AllExceptionFilter] HttpException with status 400 detected');
      // Also catch any HttpException with status 400 that isn't BadRequestException
      this.logBadRequest(exception as BadRequestException, request);
    } else {
      // Log other exceptions
      this.logger.error(exception);
    }

    // Debug: Log that exception filter was called (remove after debugging)
    if (exception instanceof HttpException && exception.getStatus() === 400) {
      console.error('[AllExceptionFilter] 400 error caught:', {
        url: request.url,
        method: request.method,
        exceptionType: exception.constructor.name,
        exceptionMessage: exception.message,
        exceptionResponse: exception.getResponse(),
      });
    }

    // const eventId = this.sentry.instance().captureException(exception);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let payload: any;

      // Check if this is a BadRequestException with validation errors (from ValidationPipe)
      if (
        exception instanceof BadRequestException &&
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse &&
        Array.isArray((exceptionResponse as any).message)
      ) {
        // This is a validation error from ValidationPipe
        const validationErrors = (exceptionResponse as any).message as ValidationError[];
        const formattedErrors = this.formatValidationErrors(validationErrors);

        // Create a flat list of all error messages
        const messages = formattedErrors.flatMap((error) =>
          error.constraints.map((c) => `${error.property}: ${c.message}`),
        );

        payload = {
          statusCode: 400,
          message: messages.length > 0 ? messages.join("; ") : "Validation failed",
          error: "Bad Request",
          errors: formattedErrors,
          type: exception.name,
          meta: {
            // eventId,
            status,
          },
          stackTrace: undefined as string | undefined,
        };
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        // Use the exception response as-is and add metadata
        payload = {
          ...(exceptionResponse as any),
          type: exception.name,
          meta: {
            // eventId,
            status,
          },
          stackTrace: undefined as string | undefined,
        };
      } else {
        // Format string responses consistently
        payload = {
          type: exception.name,
          message: exception.message,
          meta: {
            // eventId,
            status,
          },
          stackTrace: undefined as string | undefined,
        };
      }

      if (this.config.get<boolean>("app.debug")) {
        payload.stackTrace = exception.stack;
      }

      response.status(status).json(payload);
    } else {
      super.catch(exception, host);
    }
  }
}
