import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
      <SignIn appearance={{ variables: { colorPrimary: '#6366f1' } }} />
    </div>
  );
}
