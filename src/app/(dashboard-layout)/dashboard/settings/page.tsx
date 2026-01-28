"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Camera, Loader2, User, Lock, Building2, Check } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useGetMeQuery, useUpdateAccountMutation } from "@/store/api/auth.api";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth.slice";
import { toast } from "sonner";

// Profile Schema
const profileSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
});

// Password Schema
const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { data: user, isLoading } = useGetMeQuery();
  const [updateAccount] = useUpdateAccountMutation();
  const dispatch = useAppDispatch();

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Separate loading states
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  // Profile Form
  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      organizationName: "",
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.setValue("organizationName", user.organizationName || "");
      setLogoPreview(user.organizationLogo || null);
    }
  }, [user, profileForm]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onProfileSubmit = async (values: ProfileInput) => {
    const formData = new FormData();

    if (values.organizationName !== user?.organizationName) {
      formData.append("organizationName", values.organizationName);
    }
    if (logoFile) {
      formData.append("organizationLogo", logoFile);
    }

    // Check if there are changes
    if (values.organizationName === user?.organizationName && !logoFile) {
      toast.info("No changes to save");
      return;
    }

    setIsProfileUpdating(true);
    try {
      const result = await updateAccount(formData).unwrap();
      
      // Update Redux state with new user data
      if (result.account) {
        dispatch(setCredentials({
          user: result.account,
        
        }));
      }
      
      toast.success("Profile updated successfully");
      setLogoFile(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update profile");
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const onPasswordSubmit = async (values: PasswordInput) => {
    const formData = new FormData();
    formData.append("oldPassword", values.oldPassword);
    formData.append("newPassword", values.newPassword);
    formData.append("confirmPassword", values.confirmPassword);

    setIsPasswordUpdating(true);
    try {
      await updateAccount(formData).unwrap();
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to update password");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-10 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile and security preferences
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile Settings Card */}
        <Card className="shadow-lg border-muted">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your organization details and logo
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Logo Upload Section */}
            <div className="space-y-4">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Organization Logo
              </label>
              <div className="flex items-center gap-6">

                <div className="h-14 w-14 border-2 border-muted">{
                  logoPreview?
                  <img src={logoPreview || undefined} alt="Organization" />:
                  <div className="bg-muted">
                    <Building2 className="h-14 w-14 text-muted-foreground" />
                  </div>
                  }
                  
                  
                </div>
                <div className="space-y-2 mt-5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4 text-sm" />
                    Change Logo
                  </Button>
                  <p className="text-xs ml-1 text-muted-foreground">
                    PNG, JPG up to 5MB
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Form */}
            <Form {...profileForm}>
              <form
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={profileForm.control}
                  name="organizationName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email Address
                  </label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isProfileUpdating}
                >
                  {isProfileUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Profile Changes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Password Settings Card */}
        <Card className="shadow-lg border-muted">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...passwordForm}>
              <form
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={passwordForm.control}
                  name="oldPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter current password"
                          autoComplete="current-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter new password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-xs text-muted-foreground">
                        Minimum 6 characters
                      </p>
                    </FormItem>
                  )}
                />

                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Confirm new password"
                          autoComplete="new-password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                <Button
                  type="submit"
                  className="w-full"
                  disabled={isPasswordUpdating}
                >
                  {isPasswordUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
