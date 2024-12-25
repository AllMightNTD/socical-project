import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract the message from the exception
    let message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Handle the case where message is an array
    if (Array.isArray(message)) {
      message = message.join(', ');
    }
    Logger.error(
      `Exception thrown: ${message}`,
      exception.stack,
      `${request.method} ${request.url}`,
      'HttpExceptionFilter',
    );
    const detail =
      exception instanceof HttpException
        ? exception.getResponse()
        : (exception as any).message || exception;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      detail: detail,
      message: typeof message === 'string' ? message : 'An error occurred',
      error: exception.response?.error || 'Bad Request',
    };

    response.status(status).json(errorResponse);
  }
}
