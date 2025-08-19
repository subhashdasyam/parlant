import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsArray,
  IsEnum,
  ValidateNested,
  IsBoolean,
  IsDateString,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EventKind {
  MESSAGE = 'message',
  TOOL = 'tool',
  STATUS = 'status',
  CUSTOM = 'custom',
}

export enum EventSource {
  CUSTOMER = 'customer',
  CUSTOMER_UI = 'customer_ui',
  HUMAN_AGENT = 'human_agent',
  HUMAN_AGENT_ON_BEHALF_OF_AI_AGENT = 'human_agent_on_behalf_of_ai_agent',
  AI_AGENT = 'ai_agent',
  SYSTEM = 'system',
}

export enum Moderation {
  AUTO = 'auto',
  PARANOID = 'paranoid',
  NONE = 'none',
}

export enum SessionMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export class ConsumptionOffsetsDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  client?: number;
}

export class SessionDto {
  id: string;
  agent_id: string;
  customer_id: string;
  creation_utc: string;
  title?: string;
  mode: SessionMode;
  consumption_offsets: ConsumptionOffsetsDto;
}

export class CreateSessionDto {
  @IsString()
  agent_id: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class UpdateSessionDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ConsumptionOffsetsDto)
  consumption_offsets?: ConsumptionOffsetsDto;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(SessionMode)
  mode?: SessionMode;
}

export class ParticipantDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  display_name: string;
}

export enum AgentMessageGuidelineRationale {
    UNSPECIFIED = "unspecified",
    BUY_TIME = "buy_time",
    FOLLOW_UP = "follow_up",
}

export class AgentMessageGuidelineDto {
    @IsString()
    action: string;

    @IsEnum(AgentMessageGuidelineRationale)
    rationale: AgentMessageGuidelineRationale = AgentMessageGuidelineRationale.UNSPECIFIED;
}

export class CreateEventDto {
  @IsEnum(EventKind)
  kind: EventKind;

  @IsEnum(EventSource)
  source: EventSource;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentMessageGuidelineDto)
  guidelines?: AgentMessageGuidelineDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ParticipantDto)
  participant?: ParticipantDto;
}

export class EventDto {
  id: string;
  source: EventSource;
  kind: EventKind;
  offset: number;
  creation_utc: string;
  correlation_id: string;
  data: Record<string, any>;
  deleted: boolean;
}
