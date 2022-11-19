import { PipeTransform, Injectable, ArgumentMetadata, HttpStatus, ValidationPipe } from '@nestjs/common';
import { validate, ValidateByOptions } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserValidateException } from '../exceptions/custom-exception';
