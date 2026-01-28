// app/signup/page.tsx
import GuestRoute from "@/components/GuestRoute";
import SignupForm from "@/components/modules/auth/SignupForm";

export default function SignupPage() {
  return (
    <GuestRoute>
 <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
      <SignupForm />
    </div>
    </GuestRoute>
   
  );
}