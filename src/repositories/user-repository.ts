import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class UserRepository {
  async findById(id: string) {
    return await prisma.user.findFirst({ 
      where: { id },
      select: { id: true, name: true, email: true, createdAt: true, role: true, emailVerified: true, image: true },
    });
  }

  async findByEmail(email: string) {
    return await prisma.user.findFirst({ where: { email } });
  }

  async create(data: { name?: string | null; email?: string | null; password?: string | null; emailVerified?: Date | null }) {
    return await prisma.user.create({ 
      data,
      select: { id: true, name: true, email: true, createdAt: true, role: true, emailVerified: true },
    });
  }

  async markEmailVerified(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
      select: { id: true, email: true, emailVerified: true },
    });
  }

  async updateRole(userId: string, role: 'CUSTOMER' | 'VENDOR' | 'ADMIN') {
    return prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
  }

  async getUserRole(userId: string): Promise<'CUSTOMER' | 'VENDOR' | 'ADMIN' | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role || null;
  }

  async updatePassword(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, email: true },
    });
  }
}