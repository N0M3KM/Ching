import { BadRequestException, Catch, HttpException } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import type { Response } from 'express';
export class DtoPipe<T extends object> implements PipeTransform<unknown,T> {
 constructor(private readonly cls: new () => T) {}
 transform(value: unknown): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected an object.');
  const dto = plainToInstance(this.cls, value);
  const errors = validateSync(dto, { whitelist:true, forbidNonWhitelisted:true, forbidUnknownValues:true, validationError:{target:false,value:false} });
  if (errors.length) throw new BadRequestException({code:'VALIDATION_ERROR',message:'Check the submitted fields.',details:errors});
  return dto;
 }
}
@Catch()
export class ErrorFilter implements ExceptionFilter {
 catch(error: unknown, host: ArgumentsHost) {
  const status=error instanceof HttpException ? error.getStatus():500;
  const body=error instanceof HttpException ? error.getResponse():undefined;
  host.switchToHttp().getResponse<Response>().status(status).json(typeof body==='object' && body && 'code' in body ? body : {
   code:status===500?'INTERNAL_ERROR':'HTTP_'+status,
   message:status===500?'Something went wrong. Please retry.':error instanceof Error?error.message:'Request failed.',
  });
 }
}
