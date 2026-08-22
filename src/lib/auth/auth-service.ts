import type { User } from "@/types/domain";
import { users } from "@/mocks/data";

const sessionKey = "pathology-lis-session";
const demoCredentials = Object.freeze({ email: "admin@lis.local", password: "Admin@123" });
export type LoginInput = Readonly<{ email: string; password: string }>;

export const authService = {
  async login(input: LoginInput): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (input.email !== demoCredentials.email || input.password !== demoCredentials.password) throw new Error("Invalid email or password.");
    const user = users[0];
    if (!user) throw new Error("Demo user unavailable.");
    localStorage.setItem(sessionKey, JSON.stringify(user));
    return user;
  },
  logout(): void { localStorage.removeItem(sessionKey); },
  getSession(): User | null {
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    try { return JSON.parse(raw) as User; } catch { localStorage.removeItem(sessionKey); return null; }
  },
};
