import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type {
  ConnectionCatalogItemDto,
  ConnectionCatalogResponseDto,
} from '@mini-zapier/shared';
import {
  ConnectionCatalogSort,
  ConnectionCatalogUsageFilter,
  ConnectionDto,
  ConnectionType,
} from '@mini-zapier/shared';
import { decrypt, encrypt } from '@mini-zapier/server-utils';
import {
  Connection,
  ConnectionType as PrismaConnectionType,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { ListConnectionCatalogQueryDto } from './dto/list-connection-catalog-query.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';

declare const process: {
  env: Record<string, string | undefined>;
};

const MASKED_VALUE = '****';
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_CATALOG_LIMIT = 100;

type ConnectionCredentials = Record<string, string>;
type ConnectionCatalogRecord = Pick<
  Connection,
  'id' | 'name' | 'type' | 'credentials' | 'updatedAt'
>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

@Injectable()
export class ConnectionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    createConnectionDto: CreateConnectionDto,
  ): Promise<ConnectionDto> {
    const connection = await this.prisma.connection.create({
      data: {
        userId,
        name: this.normalizeName(createConnectionDto.name),
        type: this.validateType(createConnectionDto.type) as PrismaConnectionType,
        credentials: this.encryptCredentials(createConnectionDto.credentials),
      },
    });

    return this.toConnectionDto(connection);
  }

  async findAll(userId: string): Promise<ConnectionDto[]> {
    const connections = await this.prisma.connection.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return connections.map((connection) => this.toConnectionDto(connection));
  }

  async findCatalog(
    userId: string,
    queryDto: ListConnectionCatalogQueryDto,
  ): Promise<ConnectionCatalogResponseDto> {
    const page = this.parsePositiveInteger(queryDto.page, 'page', DEFAULT_PAGE);
    const limit = this.parsePositiveInteger(
      queryDto.limit,
      'limit',
      DEFAULT_LIMIT,
      MAX_CATALOG_LIMIT,
    );
    const query = this.normalizeCatalogQuery(queryDto.query);
    const type =
      queryDto.type === undefined
        ? undefined
        : (this.validateType(queryDto.type) as PrismaConnectionType);
    const usage = this.normalizeCatalogUsageFilter(queryDto.usage);
    const sort = this.normalizeCatalogSort(queryDto.sort);
    const where = this.buildCatalogWhere(userId, query, type, usage);
    const orderBy = this.buildCatalogOrderBy(sort);

    const { total, connections, usageGroups } = await this.prisma.$transaction(
      async (tx) => {
        const total = await tx.connection.count({ where });
        const connections = await tx.connection.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            type: true,
            credentials: true,
            updatedAt: true,
          },
        });
        const connectionIds = connections.map((connection) => connection.id);
        const usageGroups =
          connectionIds.length === 0
            ? []
            : await tx.workflowNode.groupBy({
                by: ['connectionId'],
                where: {
                  connectionId: {
                    in: connectionIds,
                  },
                  workflow: {
                    is: {
                      userId,
                    },
                  },
                },
                _count: {
                  connectionId: true,
                },
              });

        return {
          total,
          connections,
          usageGroups,
        };
      },
    );

    const usageCountByConnectionId = new Map<string, number>();

    for (const usageGroup of usageGroups) {
      if (usageGroup.connectionId !== null) {
        usageCountByConnectionId.set(
          usageGroup.connectionId,
          usageGroup._count.connectionId,
        );
      }
    }

    return {
      items: connections.map((connection) =>
        this.toConnectionCatalogItemDto(
          connection,
          usageCountByConnectionId.get(connection.id) ?? 0,
        ),
      ),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, id: string): Promise<ConnectionDto> {
    const connection = await this.getOwnedConnectionOrThrow(userId, id);
    return this.toConnectionDto(connection);
  }

  async update(
    userId: string,
    id: string,
    updateConnectionDto: UpdateConnectionDto,
  ): Promise<ConnectionDto> {
    const existingConnection = await this.getOwnedConnectionOrThrow(userId, id);

    const data: {
      name?: string;
      type?: PrismaConnectionType;
      credentials?: string;
    } = {};

    if (updateConnectionDto.name !== undefined) {
      data.name = this.normalizeName(updateConnectionDto.name);
    }

    if (updateConnectionDto.type !== undefined) {
      data.type = this.validateType(
        updateConnectionDto.type,
      ) as PrismaConnectionType;
    }

    if (updateConnectionDto.credentials !== undefined) {
      data.credentials = this.encryptCredentials(updateConnectionDto.credentials);
    }

    const connection =
      Object.keys(data).length === 0
        ? existingConnection
        : await this.prisma.connection.update({
            where: { id },
            data,
          });

    return this.toConnectionDto(connection);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedConnectionReferenceOrThrow(userId, id);

    const usageCount = await this.prisma.workflowNode.count({
      where: { connectionId: id },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `Connection "${id}" is used by workflow nodes and cannot be deleted.`,
      );
    }

    await this.prisma.connection.delete({
      where: { id },
    });
  }

  async getDecryptedCredentials(
    userId: string,
    connectionId: string,
  ): Promise<{ credentials: Record<string, string>; type: string }> {
    const connection = await this.getOwnedConnectionOrThrow(userId, connectionId);

    return {
      credentials: this.decryptCredentials(connection.credentials),
      type: connection.type,
    };
  }

  private async getOwnedConnectionOrThrow(
    userId: string,
    id: string,
  ): Promise<Connection> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!connection) {
      throw new NotFoundException(`Connection "${id}" not found.`);
    }

    return connection;
  }

  private async getOwnedConnectionReferenceOrThrow(
    userId: string,
    id: string,
  ): Promise<void> {
    const connection = await this.prisma.connection.findFirst({
      where: {
        id,
        userId,
      },
      select: { id: true },
    });

    if (!connection) {
      throw new NotFoundException(`Connection "${id}" not found.`);
    }
  }

  private toConnectionDto(connection: Connection): ConnectionDto {
    const credentials = this.decryptCredentials(connection.credentials);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type as ConnectionType,
      credentials: this.maskCredentials(credentials),
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private toConnectionCatalogItemDto(
    connection: ConnectionCatalogRecord,
    usageCount: number,
  ): ConnectionCatalogItemDto {
    const credentials = this.decryptCredentials(connection.credentials);

    return {
      id: connection.id,
      name: connection.name,
      type: connection.type as ConnectionType,
      usageCount,
      credentialFieldCount: Object.keys(credentials).length,
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private buildCatalogWhere(
    userId: string,
    query: string | undefined,
    type: PrismaConnectionType | undefined,
    usage: ConnectionCatalogUsageFilter,
  ): Prisma.ConnectionWhereInput {
    const where: Prisma.ConnectionWhereInput = {
      userId,
    };

    if (query !== undefined) {
      where.name = {
        contains: query,
        mode: 'insensitive',
      };
    }

    if (type !== undefined) {
      where.type = type;
    }

    const ownedWorkflowNodeFilter: Prisma.WorkflowNodeWhereInput = {
      workflow: {
        is: {
          userId,
        },
      },
    };

    if (usage === ConnectionCatalogUsageFilter.USED) {
      where.workflowNodes = {
        some: ownedWorkflowNodeFilter,
      };
    }

    if (usage === ConnectionCatalogUsageFilter.UNUSED) {
      where.workflowNodes = {
        none: ownedWorkflowNodeFilter,
      };
    }

    return where;
  }

  private buildCatalogOrderBy(
    sort: ConnectionCatalogSort,
  ): Prisma.ConnectionOrderByWithRelationInput[] {
    switch (sort) {
      case ConnectionCatalogSort.UPDATED_ASC:
        return [{ updatedAt: 'asc' }, { id: 'asc' }];
      case ConnectionCatalogSort.NAME_ASC:
        return [{ name: 'asc' }, { id: 'asc' }];
      case ConnectionCatalogSort.NAME_DESC:
        return [{ name: 'desc' }, { id: 'desc' }];
      case ConnectionCatalogSort.USAGE_DESC:
        return [
          { workflowNodes: { _count: 'desc' } },
          { updatedAt: 'desc' },
          { id: 'desc' },
        ];
      case ConnectionCatalogSort.UPDATED_DESC:
      default:
        return [{ updatedAt: 'desc' }, { id: 'desc' }];
    }
  }

  private normalizeName(name: unknown): string {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new BadRequestException('Connection name must be a non-empty string.');
    }

    return name.trim();
  }

  private validateType(type: unknown): ConnectionType {
    if (
      typeof type !== 'string' ||
      !Object.values(ConnectionType).includes(type as ConnectionType)
    ) {
      throw new BadRequestException('Connection type is invalid.');
    }

    return type as ConnectionType;
  }

  private normalizeCatalogUsageFilter(
    usage: unknown,
  ): ConnectionCatalogUsageFilter {
    if (usage === undefined) {
      return ConnectionCatalogUsageFilter.ALL;
    }

    if (
      typeof usage !== 'string' ||
      !Object.values(ConnectionCatalogUsageFilter).includes(
        usage as ConnectionCatalogUsageFilter,
      )
    ) {
      throw new BadRequestException(
        'Connection catalog usage filter is invalid.',
      );
    }

    return usage as ConnectionCatalogUsageFilter;
  }

  private normalizeCatalogSort(sort: unknown): ConnectionCatalogSort {
    if (sort === undefined) {
      return ConnectionCatalogSort.UPDATED_DESC;
    }

    if (
      typeof sort !== 'string' ||
      !Object.values(ConnectionCatalogSort).includes(
        sort as ConnectionCatalogSort,
      )
    ) {
      throw new BadRequestException('Connection catalog sort is invalid.');
    }

    return sort as ConnectionCatalogSort;
  }

  private normalizeCatalogQuery(query: unknown): string | undefined {
    if (query === undefined) {
      return undefined;
    }

    if (typeof query !== 'string') {
      throw new BadRequestException(
        'Connection catalog query must be a string.',
      );
    }

    const normalizedQuery = query.trim();

    return normalizedQuery.length === 0 ? undefined : normalizedQuery;
  }

  private encryptCredentials(credentials: unknown): string {
    const normalizedCredentials = this.validateCredentials(credentials);

    return encrypt(
      JSON.stringify(normalizedCredentials),
      this.getEncryptionKey(),
    );
  }

  private decryptCredentials(ciphertext: string): ConnectionCredentials {
    const plaintext = decrypt(ciphertext, this.getEncryptionKey());

    let parsedCredentials: unknown;

    try {
      parsedCredentials = JSON.parse(plaintext);
    } catch {
      throw new InternalServerErrorException(
        'Stored connection credentials are invalid JSON.',
      );
    }

    return this.validateCredentials(parsedCredentials);
  }

  private validateCredentials(credentials: unknown): ConnectionCredentials {
    if (!isPlainObject(credentials)) {
      throw new BadRequestException(
        'Credentials must be an object with string values.',
      );
    }

    const normalizedCredentials: ConnectionCredentials = {};

    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value !== 'string') {
        throw new BadRequestException(
          `Credential "${key}" must be a string value.`,
        );
      }

      normalizedCredentials[key] = value;
    }

    return normalizedCredentials;
  }

  private maskCredentials(
    credentials: ConnectionCredentials,
  ): ConnectionCredentials {
    return Object.fromEntries(
      Object.keys(credentials).map((key) => [key, MASKED_VALUE]),
    );
  }

  private getEncryptionKey(): string {
    const encryptionKey = process.env.APP_ENCRYPTION_KEY;

    if (!encryptionKey) {
      throw new InternalServerErrorException(
        'APP_ENCRYPTION_KEY is not configured.',
      );
    }

    return encryptionKey;
  }

  private parsePositiveInteger(
    value: unknown,
    fieldName: string,
    defaultValue: number,
    maxValue?: number,
  ): number {
    if (value === undefined) {
      return defaultValue;
    }

    const normalizedValue =
      typeof value === 'string' ? Number.parseInt(value, 10) : value;

    if (
      typeof normalizedValue !== 'number' ||
      !Number.isInteger(normalizedValue) ||
      normalizedValue <= 0
    ) {
      throw new BadRequestException(
        `${fieldName} must be a positive integer.`,
      );
    }

    if (maxValue !== undefined && normalizedValue > maxValue) {
      throw new BadRequestException(
        `${fieldName} must be less than or equal to ${maxValue}.`,
      );
    }

    return normalizedValue;
  }
}
