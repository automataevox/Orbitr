import { prisma } from "@orbitr/database";
import { logger } from "../logger";
import * as crypto from "crypto";
import { User, AuthToken, LoginCredentials, RegisterData } from "./types";

/**
 * AuthManager - Handles authentication and user management
 * Note: This is a basic implementation. In production, use OAuth2/OIDC.
 */
export class AuthManager {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      logger.info({ email: data.email }, "Registering new user");

      // Check if user already exists
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }, { username: data.username }],
        },
      });

      if (existing) {
        throw new Error("User with this email or username already exists");
      }

      // Hash password
      const passwordHash = this.hashPassword(data.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          role: "user", // First user could be admin
          apiKey: this.generateApiKey(),
        },
      });

      logger.info({ userId: user.id }, "User registered successfully");

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as "admin" | "user",
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error({ error, email: data.email }, "Registration failed");
      throw error;
    }
  }

  /**
   * Login with credentials
   */
  async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      logger.info({ email: credentials.email }, "User login attempt");

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user) {
        throw new Error("Invalid credentials");
      }

      // Verify password
      const isValid = this.verifyPassword(credentials.password, user.passwordHash);
      if (!isValid) {
        throw new Error("Invalid credentials");
      }

      // Generate token
      const token = this.generateToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store token (in production, use Redis or similar)
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      logger.info({ userId: user.id }, "User logged in successfully");

      return {
        token,
        expiresAt,
        userId: user.id,
      };
    } catch (error: any) {
      logger.error({ error, email: credentials.email }, "Login failed");
      throw error;
    }
  }

  /**
   * Verify authentication token
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      // In production, verify JWT or lookup in Redis
      // For now, this is a placeholder
      return null;
    } catch (error: any) {
      logger.error({ error }, "Token verification failed");
      return null;
    }
  }

  /**
   * Generate API key for a user
   */
  async generateUserApiKey(userId: string): Promise<string> {
    try {
      const apiKey = this.generateApiKey();

      await prisma.user.update({
        where: { id: userId },
        data: { apiKey },
      });

      logger.info({ userId }, "API key generated");
      return apiKey;
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to generate API key");
      throw error;
    }
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string): Promise<User | null> {
    try {
      const user = await prisma.user.findFirst({
        where: { apiKey },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as "admin" | "user",
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error({ error }, "API key verification failed");
      return null;
    }
  }

  /**
   * Hash password using crypto
   */
  private hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
  }

  /**
   * Verify password
   */
  private verifyPassword(password: string, storedHash: string): boolean {
    const [salt, originalHash] = storedHash.split(":");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return hash === originalHash;
  }

  /**
   * Generate authentication token
   */
  private generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Generate API key
   */
  private generateApiKey(): string {
    return `orbitr_${crypto.randomBytes(32).toString("hex")}`;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as "admin" | "user",
        createdAt: user.createdAt,
      };
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to get user");
      return null;
    }
  }

  /**
   * List all users (admin only)
   */
  async listUsers(): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role as "admin" | "user",
        createdAt: user.createdAt,
      }));
    } catch (error: any) {
      logger.error({ error }, "Failed to list users");
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: "admin" | "user"): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { role },
      });

      logger.info({ userId, role }, "User role updated");
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to update user role");
      throw error;
    }
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });

      logger.info({ userId }, "User deleted");
    } catch (error: any) {
      logger.error({ error, userId }, "Failed to delete user");
      throw error;
    }
  }
}

// Singleton instance
let authManager: AuthManager | null = null;

export function getAuthManager(): AuthManager {
  if (!authManager) {
    authManager = new AuthManager();
  }
  return authManager;
}

export default AuthManager;
