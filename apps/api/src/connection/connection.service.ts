import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConnectionDto, ConnectionType } from '@mini-zapier/shared';
import { decrypt, encrypt } from '@mini-zapier/server-utils';
import { Connection, ConnectionType as PrismaConnectionType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateConnectionDto } from './dto/create-connection.dto';
import { UpdateConnectionDto } from './dto/update-connection.dto';

declare const process: {
  env: Record<string, string | undefined>;
};

const MASKED_VALUE = '****';

type ConnectionCredentials = Record<string, string>;

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
}
