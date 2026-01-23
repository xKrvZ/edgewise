import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class BadRequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(BadRequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Log request details for abuse-report review endpoint
    if (request.path?.includes('/abuse-report') && request.method === 'PATCH') {
      console.log('[BadRequestLoggingInterceptor] Intercepting request:', {
        method: request.method,
        path: request.path,
        url: request.url,
        hasBody: !!request.body,
        bodyKeys: request.body ? Object.keys(request.body) : [],
      });
    }

    return next.handle().pipe(
      catchError((error) => {
        // Log ALL errors for abuse-report review endpoint
        if (request.path?.includes('/abuse-report') && request.method === 'PATCH') {
          console.error('[BadRequestLoggingInterceptor] Error caught:', {
            errorType: error.constructor.name,
            errorMessage: error.message,
            errorStatus: error instanceof HttpException ? error.getStatus() : 'N/A',
            errorResponse: error instanceof HttpException ? error.getResponse() : 'N/A',
          });
        }

        // Log 400 errors before they're handled by exception filters
        if (error instanceof BadRequestException || (error instanceof HttpException && error.getStatus() === 400)) {
          const exceptionResponse = error.getResponse();
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

          // Include request body if present
          try {
            if (request.body && Object.keys(request.body).length > 0) {
              logContext.body = this.sanitizeRequestBody(request.body);
            }
          } catch (e) {
            logContext.bodyNote = 'Body not available';
          }

          // Log the full exception response for debugging
          console.error('[BadRequestLoggingInterceptor] Full exception response:', JSON.stringify(exceptionResponse, null, 2));

          if (isValidationError) {
            const validationErrors = (exceptionResponse as any).message;
            const messages = this.extractValidationMessages(validationErrors);

            this.logger.error('[BadRequestLoggingInterceptor] Validation Error (400)', {
              ...logContext,
              validationErrors,
              errorMessages: messages,
            });

            console.error('[BadRequestLoggingInterceptor] Validation Error:', {
              url: request.url,
              method: request.method,
              messages,
              validationErrors: JSON.stringify(validationErrors, null, 2),
            });
          } else {
            const message =
              typeof exceptionResponse === 'object' && exceptionResponse !== null
                ? (exceptionResponse as any).message || error.message
                : error.message;

            this.logger.error('[BadRequestLoggingInterceptor] Bad Request (400)', {
              ...logContext,
              message: Array.isArray(message) ? message.join('; ') : message,
              fullResponse: exceptionResponse,
            });

            console.error('[BadRequestLoggingInterceptor] Bad Request:', {
              url: request.url,
              method: request.method,
              message: Array.isArray(message) ? message.join('; ') : message,
              fullResponse: JSON.stringify(exceptionResponse, null, 2),
            });
          }
        }

        return throwError(() => error);
      }),
    );
  }

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

    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === 'object' && !Array.isArray(sanitized[key])) {
        sanitized[key] = this.sanitizeRequestBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  private extractValidationMessages(errors: any[]): string[] {
    const messages: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        messages.push(...Object.values(error.constraints).map((msg: any) => `${error.property}: ${msg}`));
      }
      if (error.children && error.children.length > 0) {
        messages.push(...this.extractValidationMessages(error.children));
      }
    }

    return messages;
  }
}
