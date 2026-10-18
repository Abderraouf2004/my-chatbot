import type { User } from "../../modules/auth/auth.types";
import { prisma } from "../../services/prisma";

export const AuthRepo = {
  signup: async (data: User.signup) => {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
      },
    });

    if (!user) throw new Error("Failed to sign up user");
    return user;
  },
  readByEmail: async (email: string) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return user;
  },

  readById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) return null;
    return user;
  },
};
