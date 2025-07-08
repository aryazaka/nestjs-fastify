import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

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
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = Array.isArray(resObj.message) ? 'Validation error' : resObj.message || message;
        errors = resObj.message || null;
      }
    } else if (exception instanceof Error) {
      // Default pakai pesan error aslinya
      const rawMessage = exception.message || '';

      // 🔍 Cek jika error terkait database, ubah message user-friendly
      if (rawMessage.toLowerCase().includes('table') && rawMessage.toLowerCase().includes('does not exist')) {
        message = 'Error accessing database';
      } else if (rawMessage.toLowerCase().includes('prisma')) {
        message = 'Unexpected database error';
      } else {
        message = rawMessage;
      }

      errors = rawMessage;
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
