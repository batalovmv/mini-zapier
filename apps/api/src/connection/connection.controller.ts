import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put } from '@nestjs/common';
import {
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
  create(@Body() createConnectionDto: CreateConnectionDto): Promise<ConnectionDto> {
    return this.connectionService.create(createConnectionDto);
  }

  @Get()
  @ApiOperation({ summary: 'List connections' })
  @ApiOkResponse({ description: 'Connections returned.' })
  findAll(): Promise<ConnectionDto[]> {
    return this.connectionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get connection by id' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Connection returned.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  findOne(@Param('id') id: string): Promise<ConnectionDto> {
    return this.connectionService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update connection' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Connection updated.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  update(
    @Param('id') id: string,
    @Body() updateConnectionDto: UpdateConnectionDto,
  ): Promise<ConnectionDto> {
    return this.connectionService.update(id, updateConnectionDto);
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
  remove(@Param('id') id: string): Promise<void> {
    return this.connectionService.remove(id);
  }
}
