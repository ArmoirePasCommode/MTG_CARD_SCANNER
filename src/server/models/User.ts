export interface User {
  id: string;
  email: string;
  passwordHash: string;
  username: string;
  createdAt: string; // ISO
}

export interface NewUser {
  email: string;
  password: string;
  username: string;
}
