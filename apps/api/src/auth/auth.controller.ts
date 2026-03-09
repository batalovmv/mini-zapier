import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import { Public } from './public.decorator';

interface LoginBody {
  username: string;
  password: string;
}

interface CookieOptions {
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  path?: string;
  maxAge?: number;
}

interface AppResponse {
  cookie(name: string, value: string, options?: CookieOptions): void;
  clearCookie(name: string, options?: CookieOptions): void;
}

interface AppRequest {
  cookies?: Record<string, string>;
}

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  login(
    @Body() body: LoginBody,
    @Res({ passthrough: true }) res: AppResponse,
  ) {
    const cookieValue = this.authService.login(body.username, body.password);

    res.cookie(this.authService.cookieName, cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authService.isProduction,
      path: '/',
      maxAge: this.authService.maxAgeSeconds * 1000,
    });

    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  logout(@Res({ passthrough: true }) res: AppResponse) {
    res.clearCookie(this.authService.cookieName, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authService.isProduction,
      path: '/',
    });

    return { ok: true };
  }

  @Public()
  @Get('me')
  @ApiOperation({ summary: 'Check auth status' })
  me(@Req() req: AppRequest) {
    const cookieValue: string | undefined = req.cookies?.[this.authService.cookieName];

    if (!cookieValue) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = this.authService.verify(cookieValue);
      return { authenticated: true, username: payload.username };
    } catch {
      throw new UnauthorizedException('Not authenticated');
    }
  }
}
