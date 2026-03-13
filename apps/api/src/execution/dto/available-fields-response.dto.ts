import { ApiProperty } from '@nestjs/swagger';

class PositionFieldsDto {
  @ApiProperty({ example: 0, description: 'Chain position index.' })
  position!: number;

  @ApiProperty({
    example: ['id', 'customer_name', 'total', 'items', 'items.0'],
    description: 'Available field paths in dot-notation.',
  })
  fields!: string[];
}

export const AVAILABLE_FIELDS_EMPTY_STATES = [
  'NO_EXECUTIONS',
  'INCOMPATIBLE_EXECUTIONS',
  'NO_FIELDS',
] as const;

export type AvailableFieldsEmptyState =
  (typeof AVAILABLE_FIELDS_EMPTY_STATES)[number];

export class AvailableFieldsResponseDto {
  @ApiProperty({
    example: 'cm123execution',
    nullable: true,
    description: 'Source execution id, null if no compatible execution found.',
  })
  sourceExecutionId!: string | null;

  @ApiProperty({
    example: 3,
    nullable: true,
    description:
      'Workflow version of the source execution, null if no compatible execution found.',
  })
  sourceWorkflowVersion!: number | null;

  @ApiProperty({
    example: true,
    description:
      'Whether at least one SUCCESS execution exists for this workflow.',
  })
  hasExecutions!: boolean;

  @ApiProperty({
    enum: AVAILABLE_FIELDS_EMPTY_STATES,
    nullable: true,
    example: 'NO_FIELDS',
    description:
      'Reason why positions is empty. Null when compatible fields were found.',
  })
  emptyState!: AvailableFieldsEmptyState | null;

  @ApiProperty({
    type: [PositionFieldsDto],
    description:
      'Available fields per chain position. Position 0 = trigger output, position N = action N output.',
  })
  positions!: PositionFieldsDto[];
}
