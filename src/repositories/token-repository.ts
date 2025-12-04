import { PrismaClient, Token, TokenType } from "@prisma/client";

const prisma = new PrismaClient();

export class TokenRepository {
  async createEmailVerificationToken(params: { userId: string; token: string; expiresAt: Date }) {
    const { userId, token, expiresAt } = params;
    return prisma.token.create({
      data: {
        userId,
        token,
        expiresAt,
        type: TokenType.EMAIL_VERIFY,
      },
    });
  }

  async findActiveEmailVerificationToken(token: string): Promise<Token | null> {
    return prisma.token.findFirst({
      where: {
        token,
        type: TokenType.EMAIL_VERIFY,
        consumedAt: null,
        revokedAt: null,
      },
    });
  }

  async findLatestEmailVerificationTokenByUser(userId: string): Promise<Token | null> {
    return prisma.token.findFirst({
      where: {
        userId,
        type: TokenType.EMAIL_VERIFY,
        consumedAt: null,
        revokedAt: null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async consumeToken(id: string) {
    return prisma.token.update({
      where: { id },
      data: { consumedAt: new Date() },
    });
  }

  async revokeToken(id: string) {
    return prisma.token.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async createPasswordResetToken(params: { userId: string; token: string; expiresAt: Date }) {
    const { userId, token, expiresAt } = params;
    return prisma.token.create({
      data: {
        userId,
        token,
        expiresAt,
        type: TokenType.PASSWORD_RESET,
      },
    });
  }

  async findActivePasswordResetToken(token: string): Promise<Token | null> {
    return prisma.token.findFirst({
      where: {
        token,
        type: TokenType.PASSWORD_RESET,
        consumedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revokeAllPasswordResetTokensByUser(userId: string) {
    return prisma.token.updateMany({
      where: {
        userId,
        type: TokenType.PASSWORD_RESET,
        consumedAt: null,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}