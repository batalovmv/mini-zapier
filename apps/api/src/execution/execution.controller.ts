import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WorkflowExecutionDto } from '@mini-zapier/shared';

import { ListExecutionsQueryDto } from './dto/list-executions-query.dto';
import { ExecutionListResponse, ExecutionService } from './execution.service';

@ApiTags('executions')
@Controller('api')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('workflows/:id/execute')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start manual workflow execution' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiAcceptedResponse({
    description: 'Execution created and queued.',
    schema: {
      example: {
        executionId: 'cm123execution',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  @ApiBadRequestResponse({ description: 'Execution payload is invalid.' })
  async executeWorkflow(
    @Param('id') workflowId: string,
    @Body() triggerData: unknown,
  ): Promise<{ executionId: string }> {
    const result = await this.executionService.startExecution(
      workflowId,
      triggerData,
    );

    if (!result.executionId) {
      throw new InternalServerErrorException(
        'Manual execution was not created.',
      );
    }

    return {
      executionId: result.executionId,
    };
  }

  @Get('workflows/:id/executions')
  @ApiOperation({ summary: 'List workflow executions' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({ description: 'Executions returned.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  @ApiBadRequestResponse({ description: 'Pagination is invalid.' })
  getExecutions(
    @Param('id') workflowId: string,
    @Query() query: ListExecutionsQueryDto,
  ): Promise<ExecutionListResponse> {
    return this.executionService.getExecutions(workflowId, query);
  }

  @Get('executions/:id')
  @ApiOperation({ summary: 'Get execution detail with step logs' })
  @ApiParam({ name: 'id', description: 'Execution id' })
  @ApiOkResponse({ description: 'Execution returned.' })
  @ApiNotFoundResponse({ description: 'Execution not found.' })
  getExecution(@Param('id') executionId: string): Promise<WorkflowExecutionDto> {
    return this.executionService.getExecution(executionId);
  }
}
