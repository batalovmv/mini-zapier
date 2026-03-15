import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { WorkflowDto } from '@mini-zapier/shared';

import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { ListWorkflowsQueryDto } from './dto/list-workflows-query.dto';
import { UpdateWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { WorkflowListResponse, WorkflowService } from './workflow.service';

@ApiTags('workflows')
@Controller('api/workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  @ApiOperation({ summary: 'Create workflow' })
  @ApiCreatedResponse({ description: 'Workflow created.' })
  @ApiBadRequestResponse({ description: 'Workflow payload is invalid.' })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createWorkflowDto: CreateWorkflowDto,
  ): Promise<WorkflowDto> {
    return this.workflowService.create(currentUser.id, createWorkflowDto);
  }

  @Get()
  @ApiOperation({ summary: 'List workflows' })
  @ApiOkResponse({ description: 'Workflows returned.' })
  @ApiBadRequestResponse({ description: 'Pagination or filter is invalid.' })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListWorkflowsQueryDto,
  ): Promise<WorkflowListResponse> {
    return this.workflowService.findAll(currentUser.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow by id' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({ description: 'Workflow returned.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<WorkflowDto> {
    return this.workflowService.findOne(currentUser.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace workflow definition' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({ description: 'Workflow updated.' })
  @ApiBadRequestResponse({ description: 'Workflow payload is invalid.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
  ): Promise<WorkflowDto> {
    return this.workflowService.update(currentUser.id, id, updateWorkflowDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update workflow status' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiOkResponse({ description: 'Workflow status updated.' })
  @ApiBadRequestResponse({ description: 'Workflow status is invalid.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateWorkflowStatusDto: UpdateWorkflowStatusDto,
  ): Promise<WorkflowDto> {
    return this.workflowService.updateStatus(
      currentUser.id,
      id,
      updateWorkflowStatusDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiParam({ name: 'id', description: 'Workflow id' })
  @ApiNoContentResponse({ description: 'Workflow deleted.' })
  @ApiNotFoundResponse({ description: 'Workflow not found.' })
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.workflowService.remove(currentUser.id, id);
  }
}
