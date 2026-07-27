export type UsernameType = "email" | "phone";

export interface AuthUser {
  id: string;
  username: string;
  usernameType: UsernameType;
  displayName: string;
  role: "student";
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  verificationCode: string;
  displayName: string;
  password: string;
  confirmPassword: string;
}

export interface SendVerificationCodeRequest {
  username: string;
}

export interface SendVerificationCodeResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export type LoginFormValues = LoginRequest;

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormValues = RegisterRequest;

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;
