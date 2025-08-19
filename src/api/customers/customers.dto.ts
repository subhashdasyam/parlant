import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerMetadataUpdateParamsDto {
  @IsOptional()
  @IsObject()
  set?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unset?: string[];
}

export class CustomerTagUpdateParamsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}

export class CreateCustomerDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerMetadataUpdateParamsDto)
  metadata?: CustomerMetadataUpdateParamsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerTagUpdateParamsDto)
  tags?: CustomerTagUpdateParamsDto;
}

export class CustomerDto {
  id: string;
  creation_utc: string;
  name: string;
  metadata: Record<string, string>;
  tags: string[];
}
