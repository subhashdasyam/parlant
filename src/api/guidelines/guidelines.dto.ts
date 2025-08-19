import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ToolIdDto {
  @IsString()
  service_name: string;

  @IsString()
  tool_name: string;
}

export class GuidelineToolAssociationUpdateParamsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolIdDto)
  add?: ToolIdDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ToolIdDto)
  remove?: ToolIdDto[];
}

export class GuidelineTagsUpdateParamsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  add?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  remove?: string[];
}

export class GuidelineMetadataUpdateParamsDto {
  @IsOptional()
  @IsObject()
  set?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unset?: string[];
}

export class CreateGuidelineDto {
  @IsString()
  condition: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateGuidelineDto {
  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuidelineToolAssociationUpdateParamsDto)
  tool_associations?: GuidelineToolAssociationUpdateParamsDto;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuidelineTagsUpdateParamsDto)
  tags?: GuidelineTagsUpdateParamsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => GuidelineMetadataUpdateParamsDto)
  metadata?: GuidelineMetadataUpdateParamsDto;
}

export class GuidelineDto {
  id: string;
  condition: string;
  action?: string;
  metadata: Record<string, any>;
  enabled: boolean;
  tags: string[];
}
