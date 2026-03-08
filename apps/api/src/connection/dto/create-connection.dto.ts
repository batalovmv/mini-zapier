import { ConnectionType } from '@mini-zapier/shared';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConnectionDto {
  @ApiProperty({
    example: 'Webhook Secret',
    description: 'Human-readable connection name.',
  })
  name!: string;

  @ApiProperty({
    enum: ConnectionType,
    enumName: 'ConnectionType',
    example: ConnectionType.WEBHOOK,
  })
  type!: ConnectionType;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { secret: 'super-secret-value' },
    description: 'Credentials payload stored encrypted in the database.',
  })
  credentials!: Record<string, string>;
}
