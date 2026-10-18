import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { Link } from "react-router";
import { LoginUser } from "./api";
import type { LoginBodyType, LoginResponseType } from "./model";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "../../context/useAuth";
import AuthLayout from "../../layouts/AuthLayout";
import PasswordField from "../../components/PasswordField";
import { getErrorMessage } from "../../lib/getErrorMessage";
import TextField from "@mui/material/TextField";

const LoginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginForm = z.infer<typeof LoginSchema>;

const LoginScreen = () => {
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: (body: LoginBodyType) => LoginUser(body.email, body.password),
    onSuccess: (response) => {
      const user = response.data as LoginResponseType;
      login({ username: user.username, email: user.email });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to get back to your links."
      footer={
        <Typography variant="body2" color="text.secondary">
          New here?{" "}
          <Link to="/register" style={{ color: "inherit", fontWeight: 600 }}>
            Create an account
          </Link>
        </Typography>
      }
    >
      <Stack
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ gap: 2.5 }}
      >
        {loginMutation.isError && (
          <Alert severity="error">
            {getErrorMessage(
              loginMutation.error,
              "Something went wrong. Please try again.",
            )}
          </Alert>
        )}

        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          label="Password"
          autoComplete="current-password"
          fullWidth
          error={!!errors.password}
          helperText={errors.password?.message}
          {...register("password")}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!isValid || loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "Sign in"
          )}
        </Button>
      </Stack>
    </AuthLayout>
  );
};

export default LoginScreen;
