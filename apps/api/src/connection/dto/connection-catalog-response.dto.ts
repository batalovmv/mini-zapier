import type {
  ConnectionCatalogItemDto as ConnectionCatalogItemContract,
  ConnectionCatalogResponseDto as ConnectionCatalogResponseContract,
} from '@mini-zapier/shared';
import { ConnectionType } from '@mini-zapier/shared';
import { ApiProperty } from '@nestjs/swagger';

export class ConnectionCatalogItemResponseDto
  implements ConnectionCatalogItemContract
{
  @ApiProperty({ example: 'cm123connection' })
  id!: string;

  @ApiProperty({ example: 'Primary SMTP' })
  name!: string;

  @ApiProperty({
    enum: ConnectionType,
    enumName: 'ConnectionType',
    example: ConnectionType.SMTP,
  })
  type!: ConnectionType;

  @ApiProperty({
    example: 3,
    description: 'How many workflow nodes currently reference this connection.',
  })
  usageCount!: number;

  @ApiProperty({
    example: 4,
    description: 'How many credential keys are stored in the encrypted payload.',
  })
  credentialFieldCount!: number;

  @ApiProperty({ example: '2026-03-18T09:42:00.000Z' })
  updatedAt!: string;
}

export class ConnectionCatalogResponseBodyDto
  implements ConnectionCatalogResponseContract
{
  @ApiProperty({
    type: () => [ConnectionCatalogItemResponseDto],
  })
  items!: ConnectionCatalogItemResponseDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;
}
