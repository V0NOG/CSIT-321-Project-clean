import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="CSIT-321 | Sign In"
        description="Sign In Page - Access your account securely"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}