import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ConnectionDto } from '@mini-zapier/shared';

import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionService } from './connection.service';

@ApiTags('connections')
@Controller('api/connections')
export class ConnectionController {
  constructor(private readonly connectionService: ConnectionService) {}

  @Post()
  @ApiOperation({ summary: 'Create connection' })
  @ApiCreatedResponse({ description: 'Connection created.' })
  @ApiBadRequestResponse({ description: 'Connection payload is invalid.' })
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createConnectionDto: CreateConnectionDto,
  ): Promise<ConnectionDto> {
    return this.connectionService.create(currentUser.id, createConnectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List connections' })
  @ApiOkResponse({ description: 'Connections returned.' })
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ConnectionDto[]> {
    return this.connectionService.findAll(currentUser.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get connection by id' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Connection returned.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ConnectionDto> {
    return this.connectionService.findOne(currentUser.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update connection' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Connection updated.' })
  @ApiBadRequestResponse({ description: 'Connection payload is invalid.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ): Promise<ConnectionDto> {
    return this.connectionService.update(currentUser.id, id, updateConnectionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete connection' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiNoContentResponse({ description: 'Connection deleted.' })
  @ApiConflictResponse({
    description: 'Connection is used by at least one workflow node.',
  })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.connectionService.remove(currentUser.id, id);
  }
}
