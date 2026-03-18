import {
  ConnectionCatalogSort,
  ConnectionCatalogUsageFilter,
  ConnectionType,
} from '@mini-zapier/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListConnectionCatalogQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: '1-based page number.',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of items per page.',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'smtp',
    description: 'Case-insensitive search by connection name.',
  })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({
    enum: ConnectionType,
    enumName: 'ConnectionType',
    example: ConnectionType.SMTP,
  })
  @IsOptional()
  @IsEnum(ConnectionType)
  type?: ConnectionType;

  @ApiPropertyOptional({
    enum: ConnectionCatalogUsageFilter,
    enumName: 'ConnectionCatalogUsageFilter',
    example: ConnectionCatalogUsageFilter.ALL,
    default: ConnectionCatalogUsageFilter.ALL,
  })
  @IsOptional()
  @IsEnum(ConnectionCatalogUsageFilter)
  usage?: ConnectionCatalogUsageFilter;

  @ApiPropertyOptional({
    enum: ConnectionCatalogSort,
    enumName: 'ConnectionCatalogSort',
    example: ConnectionCatalogSort.UPDATED_DESC,
    default: ConnectionCatalogSort.UPDATED_DESC,
  })
  @IsOptional()
  @IsEnum(ConnectionCatalogSort)
  sort?: ConnectionCatalogSort;
}
