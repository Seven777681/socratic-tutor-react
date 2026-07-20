export type LoginFormValues = {
  studentId: string;
  password: string;
  rememberMe: boolean;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

export type RegisterFormValues = {
  studentId: string;
  name: string;
  password: string;
  confirmPassword: string;
};

export type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;
