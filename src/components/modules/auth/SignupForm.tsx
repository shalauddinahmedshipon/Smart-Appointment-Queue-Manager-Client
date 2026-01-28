"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, Building2, Mail, Lock } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import { signupSchema, SignupInput } from "@/lib/validations/auth.schema";
import { useSignupMutation } from "@/store/api/auth.api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth.slice";
import { toast } from "sonner";
import { useState } from "react";
import { store } from "@/store";
import { baseApi } from "@/store/api";

export default function SignupForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [signup, { isLoading }] = useSignupMutation();
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      organizationName: "",
    },
  });

  const onSubmit = async (values: SignupInput) => {
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);
    formData.append("organizationName", values.organizationName);

    // Append logo if selected
    const fileInput = document.getElementById("logo") as HTMLInputElement;
    if (fileInput?.files?.[0]) {
      formData.append("organizationLogo", fileInput.files[0]);
    }

    try {
      const res = await signup(formData).unwrap();

      dispatch(
        setCredentials({
          user: res.user,
          accessToken: res.accessToken,
        })
      );

      store.dispatch(baseApi.util.resetApiState());
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Signup failed");
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur">
      <CardHeader className="space-y-3 text-center pb-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg">
          <Building2 className="h-7 w-7 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">
          Create Organization
        </CardTitle>
        <CardDescription className="text-base">
          Register your clinic or business to get started
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Organization Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="City Health Clinic" 
                      className="h-11"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-10 h-11" 
                        placeholder="admin@clinic.com" 
                        autoComplete="email"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="pl-10 h-11" 
                        type="password" 
                        placeholder="••••••••"
                        autoComplete="new-password"
                        {...field} 
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-3 pt-2">
              <FormLabel className="text-sm font-semibold">Organization Logo (Optional)</FormLabel>
              <div className="grid grid-cols-2 gap-4">
                <label htmlFor="logo" className="cursor-pointer">
                  <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary transition-colors h-32">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="mt-2 text-sm text-muted-foreground">Upload Logo</span>
                  </div>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>

                {preview && (
                  <div className="flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 border-muted h-32">
                    <img src={preview} alt="Preview" className="max-h-28 object-contain" />
                  </div>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/")}
            className="text-primary hover:underline font-semibold"
          >
            Login here
          </button>
        </p>
      </CardContent>
    </Card>
  );
}

// // components/modules/auth/SignupForm.tsx
// "use client";

// import { useRouter } from "next/navigation";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { Loader2, Upload, Building2, Mail, Lock } from "lucide-react";

// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription,
// } from "@/components/ui/card";

// import { signupSchema, SignupInput } from "@/lib/validations/auth.schema";
// import { useSignupMutation } from "@/store/api/auth.api";
// import { useAppDispatch } from "@/store/hooks";
// import { setCredentials } from "@/store/slices/auth.slice";
// import { toast } from "sonner";
// import { useState } from "react";
// import { store } from "@/store";
// import { baseApi } from "@/store/api";

// export default function SignupForm() {
//   const router = useRouter();
//   const dispatch = useAppDispatch();
//   const [signup, { isLoading }] = useSignupMutation();
//   const [preview, setPreview] = useState<string | null>(null);

//   const form = useForm<SignupInput>({
//     resolver: zodResolver(signupSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//       organizationName: "",
//     },
//   });

//   const onSubmit = async (values: SignupInput) => {
//     const formData = new FormData();
//     formData.append("email", values.email);
//     formData.append("password", values.password);
//     formData.append("organizationName", values.organizationName);

//     // Append logo if selected
//     const fileInput = document.getElementById("logo") as HTMLInputElement;
//     if (fileInput?.files?.[0]) {
//       formData.append("organizationLogo", fileInput.files[0]);
//     }

//     try {
//       const res = await signup(formData).unwrap();

//        dispatch(
//       setCredentials({
//         user: res.user,
//         accessToken: res.accessToken, // 🔥 REQUIRED
//       })
//     );

//      store.dispatch(baseApi.util.resetApiState())
//       toast.success("Account created successfully!");
//       router.push("/dashboard");
//     } catch (err: any) {
//       toast.error(err?.data?.message ?? "Signup failed");
//     }
//   };

//   return (
//     <Card className="w-full max-w-md shadow-xl border-muted">
//       <CardHeader className="space-y-3 text-center">
//         <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
//           <Building2 className="h-8 w-8 text-primary" />
//         </div>
//         <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
//         <CardDescription>
//           Register your clinic or business to get started
//         </CardDescription>
//       </CardHeader>

//       <CardContent>
//         <Form {...form}>
//           <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
//             <FormField
//               control={form.control}
//               name="organizationName"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Organization Name</FormLabel>
//                   <FormControl>
//                     <Input placeholder="City Health Clinic" {...field} />
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="email"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Email</FormLabel>
//                   <FormControl>
//                     <div className="relative">
//                       <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <Input className="pl-10" placeholder="admin@clinic.com" {...field} />
//                     </div>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             <FormField
//               control={form.control}
//               name="password"
//               render={({ field }) => (
//                 <FormItem>
//                   <FormLabel>Password</FormLabel>
//                   <FormControl>
//                     <div className="relative">
//                       <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
//                       <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
//                     </div>
//                   </FormControl>
//                   <FormMessage />
//                 </FormItem>
//               )}
//             />

//             {/* Logo Upload */}
//             <div className="space-y-3">
//               <FormLabel>Organization Logo (Optional)</FormLabel>
//               <div className="grid grid-cols-2 gap-4">
//                 <label htmlFor="logo" className="cursor-pointer">
//                   <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 p-6 hover:border-primary transition-colors">
//                     <Upload className="h-8 w-8 text-muted-foreground" />
//                     <span className="mt-2 text-sm text-muted-foreground">Upload Logo</span>
//                   </div>
//                   <input
//                     id="logo"
//                     type="file"
//                     accept="image/*"
//                     className="hidden"
//                     onChange={(e) => {
//                       const file = e.target.files?.[0];
//                       if (file) {
//                         setPreview(URL.createObjectURL(file));
//                       }
//                     }}
//                   />
//                 </label>

//                 {preview && (
//                   <div className="flex items-center justify-center rounded-lg overflow-hidden bg-muted">
//                     <img src={preview} alt="Preview" className="max-h-32 object-contain" />
//                   </div>
//                 )}
//               </div>
//             </div>

//             <Button type="submit" className="w-full mt-6 py-5" disabled={isLoading}>
//               {isLoading ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Creating Account...
//                 </>
//               ) : (
//                 "Create Account"
//               )}
//             </Button>
//           </form>
//         </Form>

//         <p className="text-center text-sm text-muted-foreground mt-6">
//           Already have an account?{" "}
//           <button
//             onClick={() => router.push("/")}
//             className="text-primary hover:underline font-medium"
//           >
//             Login here
//           </button>
//         </p>
//       </CardContent>
//     </Card>
//   );
// }