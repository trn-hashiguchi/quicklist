export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface ShoppingItem {
  id: string;
  text: string;
  is_completed: boolean;
  created_by_name: string;
  created_at: string;
  completed_at?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}