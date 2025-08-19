import { IsString, MaxLength } from 'class-validator';

export class TagDto {
  id: string;
  name: string;
  creation_utc: string;
}

export class CreateTagDto {
  @IsString()
  @MaxLength(100)
  name: string;
}

export class UpdateTagDto {
  @IsString()
  @MaxLength(100)
  name: string;
}
