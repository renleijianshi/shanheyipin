export interface WeChatIdentity {
  readonly openId: string;
  readonly unionId?: string;
}

export interface WeChatIdentityProvider {
  exchangeCode(code: string): Promise<WeChatIdentity>;
}

export interface LoginUser {
  readonly id: string;
  readonly status: 'active' | 'disabled';
}

export interface LoginUserRepository {
  findOrCreateByWeChat(identity: WeChatIdentity): Promise<LoginUser>;
}

export interface SessionRepository {
  create(session: {
    readonly userId: string;
    readonly tokenHash: string;
    readonly expiresAt: Date;
  }): Promise<void>;
}

export interface SessionTokenFactory {
  create(): { readonly raw: string; readonly hash: string };
}

export interface WeChatLoginDependencies {
  readonly identityProvider: WeChatIdentityProvider;
  readonly users: LoginUserRepository;
  readonly sessions: SessionRepository;
  readonly tokens: SessionTokenFactory;
  readonly now?: () => Date;
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const WECHAT_CODE_PATTERN = /^[A-Za-z0-9_-]{6,128}$/;

export class WeChatLoginService {
  constructor(private readonly dependencies: WeChatLoginDependencies) {}

  async login(code: string) {
    if (!WECHAT_CODE_PATTERN.test(code)) {
      throw new Error('Invalid WeChat login code');
    }

    const identity = await this.dependencies.identityProvider.exchangeCode(code);
    const user = await this.dependencies.users.findOrCreateByWeChat(identity);
    if (user.status !== 'active') {
      throw new Error('User account is disabled');
    }

    const now = this.dependencies.now?.() ?? new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
    const token = this.dependencies.tokens.create();
    await this.dependencies.sessions.create({
      userId: user.id,
      tokenHash: token.hash,
      expiresAt
    });

    return { accessToken: token.raw, expiresAt, userId: user.id } as const;
  }
}
