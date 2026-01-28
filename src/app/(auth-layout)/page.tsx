import GuestRoute from "@/components/GuestRoute"
import LoginForm from "@/components/modules/auth/LoginForm"

export default function LoginPage() {
  return (
    <GuestRoute>
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <LoginForm />
      </div>
    </GuestRoute>
  )
}
