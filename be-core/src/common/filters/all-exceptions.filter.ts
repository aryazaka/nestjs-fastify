import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { TimeoutError } from 'rxjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errors = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = Array.isArray(resObj.message)
          ? 'Validation error'
          : resObj.message || message;
        errors = resObj.message || null;
      }
    } else if (exception instanceof RpcException) { // Tangani RpcException
      status = HttpStatus.INTERNAL_SERVER_ERROR; // Default untuk RpcException
      message = 'Microservice error';
      errors = exception.message || exception.stack;
    } else if (exception instanceof TimeoutError) { // Tangani TimeoutError
      status = HttpStatus.GATEWAY_TIMEOUT;
      message = 'Worker did not respond in time';
      errors = exception.message || exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message || message;
      errors = exception.stack || exception.message;
    } else if (typeof exception === 'string') {
      message = exception;
      errors = exception;
    } else if (typeof exception === 'object' && exception !== null) {
      message = (exception as any).message || message;
      errors = JSON.stringify(exception);
    } else {
      message = 'Unknown error';
      errors = String(exception);
    }

    // ✅ Tambahkan logika custom di sini:
    if (typeof message === 'string') {
      const lower = message.toLowerCase();
      if (lower.includes('table') && lower.includes('does not exist')) {
        message = 'Error accessing database';
      } else if (lower.includes('prisma')) {
        message = 'Unexpected database error';
      }
    }

    response.status(status).send({
      success: false,
      message,
      errors,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}