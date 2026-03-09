import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable, UnauthorizedException } from '@nestjs/common';

declare const process: { env: Record<string, string | undefined> };

interface CookiePayload {
  authenticated: boolean;
  username: string;
  expiresAt: number;
}

const COOKIE_NAME = 'mz_session';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

@Injectable()
export class AuthService {
  private get secret(): string {
    const s = process.env.AUTH_SESSION_SECRET;
    if (!s) throw new Error('AUTH_SESSION_SECRET env var is required');
    return s;
  }

  private get expectedUsername(): string {
    return process.env.AUTH_USERNAME ?? 'admin';
  }

  private get expectedPassword(): string {
    const p = process.env.AUTH_PASSWORD;
    if (!p) throw new Error('AUTH_PASSWORD env var is required');
    return p;
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

  login(username: string, password: string): string {
    if (username !== this.expectedUsername || password !== this.expectedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.createSignedCookie(username);
  }

  verify(cookieValue: string): CookiePayload {
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

  private createSignedCookie(username: string): string {
    const payload: CookiePayload = {
      authenticated: true,
      username,
      expiresAt: Date.now() + MAX_AGE_SECONDS * 1000,
    };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(payloadB64);
    return `${payloadB64}.${signature}`;
  }

  private sign(data: string): string {
    return createHmac('sha256', this.secret).update(data).digest('base64url');
  }
}
