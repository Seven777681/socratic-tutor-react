export type LoginFormValues = {
  studentId: string;
  password: string;
  rememberMe: boolean;
};

export type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;
