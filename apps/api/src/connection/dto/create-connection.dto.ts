import { ConnectionType } from '@mini-zapier/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreateConnectionDto {
  @ApiProperty({
    example: 'Webhook Secret',
    description: 'Human-readable connection name.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    enum: ConnectionType,
    enumName: 'ConnectionType',
    example: ConnectionType.WEBHOOK,
  })
  @IsEnum(ConnectionType)
  type!: ConnectionType;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { secret: 'super-secret-value' },
    description: 'Credentials payload stored encrypted in the database.',
  })
  @IsObject()
  credentials!: Record<string, string>;
}
