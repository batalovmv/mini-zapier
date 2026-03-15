import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

declare const process: { env: Record<string, string | undefined> };

interface CookiePayload {
  authenticated: boolean;
  userId: string;
  expiresAt: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
}

const COOKIE_NAME = 'mz_session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
const PASSWORD_HASH_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;
const scrypt = promisify(nodeScrypt);

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  private get secret(): string {
    const s = process.env.AUTH_SESSION_SECRET;
    if (!s) throw new Error('AUTH_SESSION_SECRET env var is required');
    return s;
  }

  get cookieName(): string {
    return COOKIE_NAME;
  }

  get maxAgeSeconds(): number {
    return MAX_AGE_SECONDS;
  }

  get isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  async register(email: string, password: string): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
      },
    });

    return this.createSignedCookie(user.id);
  }

  async login(email: string, password: string): Promise<string> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSignedCookie(user.id);
  }

  async getAuthenticatedUser(cookieValue: string): Promise<AuthenticatedUser> {
    const payload = this.verifySignedCookie(cookieValue);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Not authenticated');
    }

    return user;
  }

  private verifySignedCookie(cookieValue: string): CookiePayload {
    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) {
      throw new UnauthorizedException('Invalid session');
    }

    const payloadB64 = cookieValue.substring(0, dotIndex);
    const signatureB64 = cookieValue.substring(dotIndex + 1);

    const expectedSig = this.sign(payloadB64);
    const sigBuf = Buffer.from(signatureB64, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');

    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
      throw new UnauthorizedException('Invalid session');
    }

    let payload: CookiePayload;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
    } catch {
      throw new UnauthorizedException('Invalid session');
    }

    if (!payload.authenticated || Date.now() > payload.expiresAt) {
      throw new UnauthorizedException('Session expired');
    }

    return payload;
  }

  private createSignedCookie(userId: string): string {
    const payload: CookiePayload = {
      authenticated: true,
      userId,
      expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(payloadB64);
    return `${payloadB64}.${signature}`;
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;
    return `${PASSWORD_HASH_ALGORITHM}$${salt}$${derivedKey.toString('hex')}`;
  }

  private async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, expectedHash] = storedHash.split('$');

    if (algorithm !== PASSWORD_HASH_ALGORITHM || !salt || !expectedHash) {
      return false;
    }

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const actualBuffer = (await scrypt(password, salt, PASSWORD_KEY_LENGTH)) as Buffer;

    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  private sign(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }
}
