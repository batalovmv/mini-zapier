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
  Query,
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
import type { ConnectionCatalogResponseDto } from '@mini-zapier/shared';
import { ConnectionDto } from '@mini-zapier/shared';

import type { AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ConnectionCatalogResponseBodyDto } from './dto/connection-catalog-response.dto';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { ListConnectionCatalogQueryDto } from './dto/list-connection-catalog-query.dto';
import { TestQueryDto } from './dto/test-query.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';
import { ConnectionService } from './connection.service';
import { IntrospectionService } from './introspection.service';

@ApiTags('connections')
@Controller('api/connections')
export class ConnectionController {
  constructor(
    private readonly connectionService: ConnectionService,
    private readonly introspectionService: IntrospectionService,
  ) {}

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

  @Get('catalog')
  @ApiOperation({ summary: 'List connection catalog summaries' })
  @ApiOkResponse({
    description: 'Paginated connection catalog summary returned.',
    type: ConnectionCatalogResponseBodyDto,
  })
  @ApiBadRequestResponse({
    description: 'Catalog pagination, filters, or sort are invalid.',
  })
  findCatalog(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: ListConnectionCatalogQueryDto,
  ): Promise<ConnectionCatalogResponseDto> {
    return this.connectionService.findCatalog(currentUser.id, query);
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

  @Get(':id/introspect/tables')
  @ApiOperation({ summary: 'List tables for a PostgreSQL connection' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Tables returned.' })
  @ApiBadRequestResponse({ description: 'Connection is not PostgreSQL.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  introspectTables(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<{ tables: string[] }> {
    return this.introspectionService.getTables(currentUser.id, id);
  }

  @Get(':id/introspect/tables/:table/columns')
  @ApiOperation({ summary: 'List columns for a table' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiParam({ name: 'table', description: 'Table name' })
  @ApiOkResponse({ description: 'Columns returned.' })
  @ApiBadRequestResponse({ description: 'Connection is not PostgreSQL.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  introspectColumns(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Param('table') table: string,
  ): Promise<{ columns: { name: string; type: string; nullable: boolean }[] }> {
    return this.introspectionService.getColumns(currentUser.id, id, table);
  }

  @Post(':id/introspect/query')
  @ApiOperation({ summary: 'Test a read-only SQL query' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Query result returned.' })
  @ApiBadRequestResponse({ description: 'Invalid or non-SELECT query.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  testQuery(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() testQueryDto: TestQueryDto,
  ): Promise<{ rows: unknown[]; rowCount: number }> {
    return this.introspectionService.testQuery(
      currentUser.id,
      id,
      testQueryDto.query,
      testQueryDto.params ?? [],
    );
  }

  @Post(':id/introspect/mutation')
  @ApiOperation({ summary: 'Test a mutation SQL query (rolled back after test)' })
  @ApiParam({ name: 'id', description: 'Connection id' })
  @ApiOkResponse({ description: 'Affected row count returned (changes rolled back).' })
  @ApiBadRequestResponse({ description: 'Invalid or non-mutation query.' })
  @ApiNotFoundResponse({ description: 'Connection not found.' })
  testMutation(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() testQueryDto: TestQueryDto,
  ): Promise<{ rowCount: number }> {
    return this.introspectionService.testMutation(
      currentUser.id,
      id,
      testQueryDto.query,
      testQueryDto.params ?? [],
    );
  }
}
