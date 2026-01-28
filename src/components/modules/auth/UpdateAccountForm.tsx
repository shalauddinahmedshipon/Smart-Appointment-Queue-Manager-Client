"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCredentials } from "@/store/slices/auth.slice";
import { useUpdateAccountMutation } from "@/store/api/auth.api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from "@/components/ui/form";
import { UpdatePasswordInput, updatePasswordSchema, UpdateProfileInput, updateProfileSchema } from "@/lib/validations/auth.schema";


export default function SettingsForms() {
  const { user, accessToken } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [updateAccount, { isLoading }] = useUpdateAccountMutation();
  const [file, setFile] = useState<File | null>(null);

  // Profile form
  const profileForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      organizationName: user?.organizationName || "",
    },
  });

  // Password form
  const passwordForm = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Shared submit function
  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value as string);
      });
      if (file) formData.append("organizationLogo", file);

      const res = await updateAccount(formData).unwrap();

      dispatch(
        setCredentials({
          user: res.account,
          accessToken: accessToken!,
        })
      );

      toast.success(res.message);

      profileForm.reset({ organizationName: res.account.organizationName });
      passwordForm.reset();
      setFile(null);
    } catch (err: any) {
      toast.error(err?.data?.message || "Update failed");
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto p-6">
      {/* Profile Section */}
      <Form {...profileForm}>
        <form
          onSubmit={profileForm.handleSubmit(handleSubmit)}
          className="space-y-4 bg-white p-6 rounded-xl shadow-md"
        >
          <h2 className="text-lg font-bold">Update Profile</h2>

          <FormField
            control={profileForm.control}
            name="organizationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Organization Name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Organization Logo</FormLabel>
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </FormItem>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </Form>

      {/* Password Section */}
      <Form {...passwordForm}>
        <form
          onSubmit={passwordForm.handleSubmit(handleSubmit)}
          className="space-y-4 bg-white p-6 rounded-xl shadow-md"
        >
          <h2 className="text-lg font-bold">Change Password</h2>

          <FormField
            control={passwordForm.control}
            name="oldPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Old Password</FormLabel>
                <FormControl>
                  <Input type="password" {...field} placeholder="Old Password" />
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
                  <Input type="password" {...field} placeholder="New Password" />
                </FormControl>
                <FormMessage />
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
                  <Input type="password" {...field} placeholder="Confirm New Password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Updating..." : "Change Password"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
