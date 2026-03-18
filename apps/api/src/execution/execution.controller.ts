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
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { StepTestResponse, WorkflowExecutionDto } from '@mini-zapier/shared';

import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { AvailableFieldsResponseDto } from './dto/available-fields-response.dto';
import { ListAllExecutionsQueryDto } from './dto/list-all-executions-query.dto';
import { StepTestBodyDto } from './dto/step-test.dto';
import { ListExecutionsQueryDto } from './dto/list-executions-query.dto';
import {
  ExecutionListResponse,
  ExecutionService,
  GlobalExecutionListResponse,
} from './execution.service';

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
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') workflowId: string,
    @Body() triggerData: unknown,
  ): Promise<{ executionId: string }> {
    const result = await this.executionService.startManualExecution(
      currentUser.id,
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

  @Post('workflows/:id/steps/test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Test a single action step with mock input data' })
  @ApiParam({ name: 'id', description: 'Workflow id (for ownership check)' })
  @ApiOkResponse({ description: 'Step test result.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  @ApiForbiddenResponse({ description: 'Connection not owned by user.' })
  @ApiBadRequestResponse({ description: 'Invalid step test payload.' })
  async testStep(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') workflowId: string,
    @Body() body: StepTestBodyDto,
  ): Promise<StepTestResponse> {
    return this.executionService.testStep(currentUser.id, workflowId, body);
  }

  @Get('workflows/:id/executions')
  @ApiOperation({
    summary: 'List workflow executions with optional status filter and counts',
  })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({
    description:
      'Filtered executions returned with aggregate counts for the whole workflow.',
  })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  @ApiBadRequestResponse({ description: 'Pagination is invalid.' })
  getExecutions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') workflowId: string,
    @Query() query: ListExecutionsQueryDto,
  ): Promise<ExecutionListResponse> {
    return this.executionService.getExecutions(currentUser.id, workflowId, query);
  }

  @Get('workflows/:id/available-fields')
  @ApiOperation({ summary: 'Get available template fields for workflow actions' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({
    description: 'Available fields returned.',
    type: AvailableFieldsResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  getAvailableFields(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') workflowId: string,
  ): Promise<AvailableFieldsResponseDto> {
    return this.executionService.getAvailableFields(currentUser.id, workflowId);
  }

  @Get('executions')
  @ApiOperation({
    summary: 'List all executions for the current user with optional filters',
  })
  @ApiOkResponse({
    description:
      'All user executions returned with aggregate counts and workflow names.',
  })
  @ApiBadRequestResponse({ description: 'Pagination is invalid.' })
  listAllExecutions(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListAllExecutionsQueryDto,
  ): Promise<GlobalExecutionListResponse> {
    return this.executionService.listAllExecutions(currentUser.id, query);
  }

  @Get('executions/:id')
  @ApiOperation({ summary: 'Get execution detail with step logs' })
  @ApiParam({ name: 'id', description: 'Execution id' })
  @ApiOkResponse({ description: 'Execution returned.' })
  @ApiNotFoundResponse({ description: 'Execution not found.' })
  getExecution(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') executionId: string,
  ): Promise<WorkflowExecutionDto> {
    return this.executionService.getExecution(currentUser.id, executionId);
  }
}
