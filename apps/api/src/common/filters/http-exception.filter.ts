import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

interface HttpRequestLike {
  url?: string;
}

interface HttpResponseLike {
  status: (statusCode: number) => HttpResponseLike;
  json: (body: unknown) => unknown;
}

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponseLike>();
    const request = context.getRequest<HttpRequestLike>();
    const statusCode = this.getStatusCode(exception);
    const errorResponse = this.getErrorResponse(exception, statusCode);

    response.status(statusCode).json({
      ...errorResponse,
      path: request.url ?? '',
      timestamp: new Date().toISOString(),
    } satisfies ErrorResponseBody);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorResponse(
    exception: unknown,
    statusCode: number,
  ): Omit<ErrorResponseBody, 'path' | 'timestamp'> {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode,
        error: HttpStatus[statusCode] ?? 'Internal Server Error',
        message: 'Internal server error.',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        statusCode,
        error: HttpStatus[statusCode] ?? exception.name,
        message: response,
      };
    }

    if (isPlainObject(response)) {
      const message = response.message;
      const error = response.error;

      return {
        statusCode,
        error:
          typeof error === 'string'
            ? error
            : HttpStatus[statusCode] ?? exception.name,
        message:
          typeof message === 'string' || Array.isArray(message)
            ? message
            : exception.message,
      };
    }

    return {
      statusCode,
      error: HttpStatus[statusCode] ?? exception.name,
      message: exception.message,
    };
  }
}
