import * as argon2 from "argon2";

export class HashService {
  private static instance: HashService | null = null;

  private constructor() {}

  static getInstance(): HashService {
    if (!HashService.instance) {
      HashService.instance = new HashService();
    }

    return HashService.instance;
  }

  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await argon2.verify(hashedPassword, password);
  }
}

export const hash = HashService.getInstance();
