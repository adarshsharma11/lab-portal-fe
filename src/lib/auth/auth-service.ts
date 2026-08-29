import type { User } from "@/types/domain";
import { apiClient } from "@/lib/api/client";

const sessionKey = "pathology-lis-session";
const tokenKey = "pathology-lis-token";

export type LoginInput = Readonly<{ email: string; password: string }>;
export type SignupInput = Readonly<{
  name: string;
  email: string;
  password: string;
  role: string;
  mobile?: string;
  location?: string;
}>;

export const authService = {
  async register(input: SignupInput): Promise<User> {
    const res = await apiClient.post<User & { token?: string }>("/auth/register", input);
    const user = res.data;
    const token = res.token || (res as any).data?.token || (res as any).jwt || "demo-token";

    if (!user) throw new Error("Unable to create account. Please try again.");

    if (typeof window !== "undefined") {
      localStorage.setItem(sessionKey, JSON.stringify(user));
      localStorage.setItem(tokenKey, token);
    }
    return user;
  },

  async login(input: LoginInput): Promise<User> {
    const res = await apiClient.post<User & { token?: string }>("/auth/login", input);
    const user = res.data;
    const token = res.token || (res as any).data?.token || (res as any).jwt || "demo-token";

    if (!user) throw new Error("Unable to sign in. Please check your credentials.");

    if (typeof window !== "undefined") {
      localStorage.setItem(sessionKey, JSON.stringify(user));
      localStorage.setItem(tokenKey, token);
    }
    return user;
  },

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem(tokenKey);
      localStorage.removeItem("active_franchise_id");
    }
    apiClient.post("/auth/logout").catch(() => {});
  },

  getSession(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(sessionKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      localStorage.removeItem(sessionKey);
      localStorage.removeItem(tokenKey);
      return null;
    }
  },

  updateSession(updatedUser: Partial<User>): User | null {
    if (typeof window === "undefined") return null;
    const current = this.getSession();
    if (!current) return null;
    const merged = { ...current, ...updatedUser };
    localStorage.setItem(sessionKey, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent("auth-session-update", { detail: merged }));
    return merged;
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(tokenKey);
  },
};
