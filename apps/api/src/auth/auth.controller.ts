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
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

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
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: AppResponse,
  ) {
    const cookieValue = await this.authService.register(body.email, body.password);
    this.setSessionCookie(res, cookieValue);

    return { ok: true };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ login: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'User login' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: AppResponse,
  ) {
    const cookieValue = await this.authService.login(body.email, body.password);
    this.setSessionCookie(res, cookieValue);

    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User logout' })
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
  async me(@Req() req: AppRequest) {
    const cookieValue: string | undefined = req.cookies?.[this.authService.cookieName];

    if (!cookieValue) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.getAuthenticatedUser(cookieValue);
    return { authenticated: true, user };
  }

  private setSessionCookie(res: AppResponse, cookieValue: string): void {
    res.cookie(this.authService.cookieName, cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.authService.isProduction,
      path: '/',
      maxAge: this.authService.maxAgeSeconds * 1000,
    });
  }
}
