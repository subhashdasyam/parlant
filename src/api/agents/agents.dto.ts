import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsArray,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CompositionMode {
  FLUID = 'fluid',
  CANNED_FLUID = 'canned_fluid',
  CANNED_COMPOSITED = 'composited_canned',
  CANNED_STRICT = 'strict_canned',
}

export class AgentTagUpdateDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}

export class CreateAgentDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_engine_iterations?: number;

  @IsOptional()
  @IsEnum(CompositionMode)
  composition_mode?: CompositionMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  max_engine_iterations?: number;

  @IsOptional()
  @IsEnum(CompositionMode)
  composition_mode?: CompositionMode;

  @IsOptional()
  @ValidateNested()
  @Type(() => AgentTagUpdateDto)
  tags?: AgentTagUpdateDto;
}

export class AgentDto {
  id: string;
  name: string;
  description?: string;
  creation_utc: string;
  max_engine_iterations: number;
  composition_mode: CompositionMode;
  tags: string[];
}
