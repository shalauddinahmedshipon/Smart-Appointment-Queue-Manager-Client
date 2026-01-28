export interface User {
  id: string;
  email: string;
  organizationName: string;
  organizationLogo?: string | null;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null; // 🔥 REQUIRED
  isAuthenticated: boolean;
}
