import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListExecutionsQueryDto {
  @ApiPropertyOptional({
    example: '1',
    description: 'Page number starting from 1.',
  })
  page?: string;

  @ApiPropertyOptional({
    example: '20',
    description: 'Page size.',
  })
  limit?: string;
}
