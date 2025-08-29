import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="CSIT-321 | Sign Up"
        description="Sign Up Page - Create a new account securely"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
