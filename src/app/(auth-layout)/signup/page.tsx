import GuestRoute from "@/components/GuestRoute";
import SignupForm from "@/components/modules/auth/SignupForm";
import Image from "next/image";


export default function SignupPage() {
  return (
    <GuestRoute>
      <div className="min-h-screen flex">
        {/* Left Side - Banner Image */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative">
          <Image
            src="/hms-2.jpg"
            alt="HMS Banner"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
          
          {/* Overlay Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
            <h1 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                MediQueue
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-lg">
              Create your organization account and start managing your healthcare operations efficiently.
            </p>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-muted/30 to-muted/10">
          <SignupForm />
        </div>
      </div>
    </GuestRoute>
  );
}
