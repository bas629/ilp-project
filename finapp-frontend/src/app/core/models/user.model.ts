export interface UserDto {
  name: string;
  email: string;
  password: string;
  mobileNo: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  status: boolean;
  userId: number | null;
  name: string | null;
  message: string;
  token?: string;
  role?: 'user' | 'admin' | 'superadmin';
  isNewUser?: boolean;
}

export interface LoggedInUser {
  userId: number;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  token: string;
  isNewUser: boolean;
}
