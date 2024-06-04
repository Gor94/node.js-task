import { IsOptional, IsUUID } from 'class-validator';

export class RemoveMessageDto {
  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsUUID()
  messageId: string;
}
