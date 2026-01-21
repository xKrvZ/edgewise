import {
  Catch,
  ArgumentsHost,
  HttpException,
  BadRequestException,
  Injectable,
  Inject,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
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

  catch(exception: unknown, host: ArgumentsHost) {
    this.logger.error(exception);
    // const eventId = this.sentry.instance().captureException(exception);

    if (exception instanceof HttpException) {
      const ctx = host.switchToHttp();
      // const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
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
