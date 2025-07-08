import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((response: any) => {
        // response mungkin punya data, message, atau field tambahan lain
        // Kita ambil semua, tapi pastikan success true dan default message
        return {
          success: true,
          message: response?.message ?? 'Request successful',
          ...response, // merge semua field tambahan (misalnya test: 200)
        };
      }),
    );
  }
}
