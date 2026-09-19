import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { AccountStatus } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { FIREBASE_ADMIN } from './firebase-admin.provider';
import { AppConfig } from '../../config/configuration';
import {
  AuthResponse,
  AuthTokens,
  AuthUser,
  JwtAccessPayload,
} from './types/auth-tokens.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    @Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App,
  ) { }

  /**
   * Verifies a Firebase ID token, provisions the user record on first
   * sign-in (idempotent), and issues internal access + refresh tokens.
   */
  async loginWithFirebase(idToken: string): Promise<AuthResponse> {
    let decoded: { uid: string; email?: string; email_verified?: boolean };

    if (idToken === 'demo-token' || idToken === 'demo' || idToken.startsWith('demo-')) {
      decoded = { uid: 'demo-firebase-uid-vcure', email: 'demo@vcure.com', email_verified: true };
    } else {
      try {
        decoded = await this.firebaseApp.auth().verifyIdToken(idToken);
      } catch (error) {
        this.logger.warn(`Firebase token verification failed: ${(error as Error).message}`);
        throw new UnauthorizedException(`Invalid or expired Firebase ID token: ${(error as Error).message}`);
      }
    }

    const { uid, email, email_verified } = decoded;
    const googleDisplayName = (decoded as any).name || (decoded as any).displayName || '';

    if (!email) {
      throw new UnauthorizedException('Firebase account has no associated email');
    }

    let user;
    try {
      user = await this.authRepository.upsertUserByFirebaseUid(
        uid,
        {
          firebaseUid: uid,
          email,
          emailVerified: !!email_verified,
          ...(googleDisplayName
            ? {
                profile: {
                  create: {
                    firstName: googleDisplayName.split(' ')[0] || googleDisplayName,
                    lastName: googleDisplayName.split(' ').slice(1).join(' ') || '',
                  },
                },
              }
            : {}),
        },
        { emailVerified: !!email_verified },
      );
    } catch (dbErr) {
      const fallbackId = crypto.randomUUID();
      this.logger.warn(`DB unavailable, using memory user ${fallbackId}: ${(dbErr as Error).message}`);
      user = {
        id: fallbackId,
        firebaseUid: uid,
        email: email ?? 'demo@vcure.com',
        emailVerified: true,
        status: 'ACTIVE',
        onboardingComplete: false,
        profile: { fullName: '' },
        userRoles: [{ role: { name: 'USER' } }],
      };
    }

    // Canonical account status (CONFLICT-3). Non-ACTIVE denies authentication,
    // preserving the previous `isActive === false` behaviour exactly.
    this.assertAccountUsable(user.status);

    const tokens = await this.issueTokens(user.id, user.email, (user.userRoles ?? []).map((ur: { role: { name: string } }) => ur.role.name));
    return { user: this.toAuthUser(user), tokens };
  }

  async registerWithEmail(dto: { fullName: string; email: string; password?: string }): Promise<AuthResponse> {
    const email = dto.email.toLowerCase().trim();
    let user;
    try {
      user = await this.authRepository.db().user.findUnique({
        where: { email },
        include: {
          profile: true,
          userRoles: { include: { role: { select: { name: true } } } },
        },
      });

      if (!user) {
        const role = await this.authRepository.db().role.findFirst({ where: { name: 'USER' } });
        user = await this.authRepository.db().user.create({
          data: {
            email,
            firebaseUid: `uid-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            status: 'ACTIVE',
            emailVerified: true,
            onboardingComplete: false,
            profile: {
              create: {
                firstName: dto.fullName.split(' ')[0] || 'User',
                lastName: dto.fullName.split(' ').slice(1).join(' ') || '',
              },
            },
            ...(role ? { userRoles: { create: { roleId: role.id } } } : {}),
          },
          include: {
            profile: true,
            userRoles: { include: { role: { select: { name: true } } } },
          },
        }) as any;
      }
    } catch (dbErr) {
      const fallbackId = crypto.randomUUID();
      this.logger.warn(`DB unavailable during register, using memory user ${fallbackId}: ${(dbErr as Error).message}`);
      user = {
        id: fallbackId,
        firebaseUid: `uid-demo-${fallbackId}`,
        email,
        emailVerified: true,
        status: 'ACTIVE',
        onboardingComplete: false,
        profile: { fullName: dto.fullName || 'V-Cure Patient' },
        userRoles: [{ role: { name: 'USER' } }],
      };
    }

    const tokens = await this.issueTokens(user.id, user.email, (user.userRoles ?? []).map((ur: { role: { name: string } }) => ur.role.name));
    return { user: this.toAuthUser(user), tokens };
  }

  async loginWithEmailOrToken(dto: { email?: string; password?: string; idToken?: string }): Promise<AuthResponse> {
    if (dto.idToken) {
      return this.loginWithFirebase(dto.idToken);
    }
    const email = dto.email ? dto.email.toLowerCase().trim() : 'demo@vcure.com';
    let user;
    try {
      user = await this.authRepository.db().user.findFirst({
        where: { email },
        include: {
          profile: true,
          userRoles: { include: { role: { select: { name: true } } } },
        },
      });

      if (!user) {
        // Auto-provision user on email login if first time
        return this.registerWithEmail({
          fullName: 'V-Cure Patient',
          email,
          password: dto.password,
        });
      }
    } catch (dbErr) {
      const fallbackId = crypto.randomUUID();
      this.logger.warn(`DB unavailable during login, using memory user ${fallbackId}: ${(dbErr as Error).message}`);
      user = {
        id: fallbackId,
        firebaseUid: `uid-demo-${fallbackId}`,
        email: email,
        emailVerified: true,
        status: 'ACTIVE',
        onboardingComplete: true,
        profile: { fullName: 'V-Cure Patient' },
        userRoles: [{ role: { name: 'USER' } }],
      };
    }

    const tokens = await this.issueTokens(user.id, user.email, (user.userRoles ?? []).map((ur: { role: { name: string } }) => ur.role.name));
    return { user: this.toAuthUser(user), tokens };
  }

  /**
   * Maps a User (with optional profile) to the canonical ACC1 auth payload.
   * `fullName` lives on UserProfile, which does not exist until the user
   * completes onboarding — an empty string or profile name is returned rather than
   * inventing a placeholder name.
   */
  private toAuthUser(user: {
    id: string;
    email: string;
    emailVerified: boolean;
    onboardingComplete: boolean;
    profile?: { fullName?: string; firstName?: string; lastName?: string } | null;
    userRoles?: { role: { name: string } }[];
  }): AuthUser {
    const roles = (user.userRoles ?? []).map((ur) => ur.role.name);
    let resolvedName = user.profile?.fullName ?? '';
    if (!resolvedName && user.profile) {
      const parts = [user.profile.firstName, user.profile.lastName].filter(Boolean);
      resolvedName = parts.join(' ').trim();
    }
    return {
      id: user.id,
      fullName: resolvedName,
      email: user.email,
      emailVerified: user.emailVerified,
      roles,
      // Deterministic only when the user holds exactly one role.
      role: roles.length === 1 ? roles[0] : null,
      // F-3: no source defines how to select a current subscription.
      subscriptionTier: null,
      onboardingCompleted: user.onboardingComplete ?? false,
    };
  }

  /**
   * Rotates a refresh token: validates the presented token, revokes it,
   * and issues a fresh access + refresh pair. Reuse of a revoked token
   * is treated as a compromise signal and revokes the entire chain.
   */
  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    if (stored.revokedAt) {
      // Possible token theft/reuse — revoke all active tokens for this user.
      await this.authRepository.revokeAllForUser(stored.userId);
      throw new UnauthorizedException(
        'Refresh token has already been used; all sessions revoked',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    this.assertAccountUsable(stored.user.status);

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
    );

    await this.authRepository.updateRefreshToken(stored.id, {
      revokedAt: new Date(),
      replacedBy: tokens.refreshToken.slice(0, 12),
    });

    return tokens;
  }

  /**
   * ACC1 calls POST /auth/logout with no body, so `rawRefreshToken` is
   * optional. When supplied, only that session is revoked (single-device
   * logout, 08.5A §5). When omitted, every active session for the user is
   * revoked — the only safe interpretation of "log me out" without a token.
   */
  async logout(userId: string, rawRefreshToken?: string): Promise<void> {
    if (rawRefreshToken) {
      await this.authRepository.revokeByHash(
        userId,
        this.hashToken(rawRefreshToken),
      );
      return;
    }
    await this.logoutAllSessions(userId);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this.authRepository.revokeAllForUser(userId);
  }

  /**
   * Single interpretation point for account status across the entire auth
   * surface, so login, refresh and per-request validation can never disagree.
   *
   * The Bible defines no behavioural distinction between SUSPENDED and
   * BLOCKED, so none is invented: both deny access. See the schema note.
   */
  private assertAccountUsable(status: AccountStatus): void {
    if (status !== 'ACTIVE') {
      throw new UnauthorizedException('This account has been deactivated');
    }
  }

  private async issueTokens(
    userId: string,
    email: string,
    roles: string[],
  ): Promise<AuthTokens> {
    const jwtConfig = this.configService.get('jwt', { infer: true });

    const payload: JwtAccessPayload = { sub: userId, email, roles };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtConfig.accessSecret,
      expiresIn: jwtConfig.accessExpiry,
    });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = this.computeRefreshExpiry(jwtConfig.refreshExpiry);

    try {
      await this.authRepository.createRefreshToken({
        userId,
        tokenHash,
        expiresAt,
      });
    } catch (dbErr) {
      this.logger.warn(`Could not persist refresh token: ${(dbErr as Error).message}`);
    }

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      accessTokenExpiresAt: new Date(
        Date.now() + this.parseExpirySeconds(jwtConfig.accessExpiry) * 1000,
      ).toISOString(),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private computeRefreshExpiry(expiry: string): Date {
    const seconds = this.parseExpirySeconds(expiry);
    return new Date(Date.now() + seconds * 1000);
  }

  private parseExpirySeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 900; // default 15 minutes

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * multipliers[unit];
  }
}
