import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "user", "viewer"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
