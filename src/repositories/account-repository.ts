import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AccountRepository {
  async findByProviderAccount(provider: string, providerAccountId: string) {
    return prisma.account.findFirst({
      where: { provider, providerAccountId },
    });
  }

  async createAccount(params: {
    userId: string;
    provider: string;
    providerAccountId: string;
    accessToken?: string | null;
    refreshToken?: string | null;
    expiresAt?: Date | null;
  }) {
    const { userId, provider, providerAccountId, accessToken, refreshToken, expiresAt } = params;
    return prisma.account.create({
      data: {
        userId,
        provider,
        providerAccountId,
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  }

  async updateAccountTokens(id: string, params: { accessToken?: string | null; refreshToken?: string | null; expiresAt?: Date | null }) {
    const { accessToken, refreshToken, expiresAt } = params;
    return prisma.account.update({
      where: { id },
      data: {
        accessToken,
        refreshToken,
        expiresAt,
      },
    });
  }
}

