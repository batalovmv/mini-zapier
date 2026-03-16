import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TestQueryDto {
  @ApiProperty({
    example: 'SELECT * FROM users WHERE id = $1',
    description: 'SQL query to execute (SELECT/WITH only).',
  })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({
    type: 'array',
    items: {},
    example: [1],
    description: 'Positional parameters for the query.',
  })
  @IsOptional()
  @IsArray()
  params?: unknown[];
}
