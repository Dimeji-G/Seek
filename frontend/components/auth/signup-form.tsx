"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { PrimaryInput } from "@/components/auth-input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { signupSchema } from "@/models/validations/auth.validation";
import { z } from "zod";
import { toast } from "sonner";
import authService from "@/services/auth.service";
import { useState } from "react";
import useAuthStore from "@/store/auth.store";
import Link from "next/link";

interface SignUpFormProps {
  form: UseFormReturn<z.infer<typeof signupSchema>>;
  onSubmit: (values: z.infer<typeof signupSchema>) => void;
  onSuccess?: (email: string) => void;
}

const SignUpForm = ({ form, onSubmit }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const updateSignupData = useAuthStore((state) => state.updateSignupData);

  const handleSubmit = async (values: z.infer<typeof signupSchema>) => {
    try {
      setIsLoading(true);
      // Save initial signup data to store
      updateSignupData({
        ...values,
      });

      // Call the register API
      const response = await authService.register({
        firstName: values.FirstName,
        lastName: values.LastName,
        email: values.Email,
        password: values.Password,
        phone_number: values.PhoneNumber || undefined,
      });

      // Update store with user data from the response (if available)
      updateSignupData({
        userId: response.user?.id || undefined,
        Email: values.Email,
        currentStep: 1,
      });

      onSubmit(values);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-[29px]/[auto] text-[#737373] font-semibold mb-[22px]">
        Create your account
      </h2>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-8 satoshi flex flex-col"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="FirstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">First Name *</FormLabel>
                  <FormControl>
                    <PrimaryInput placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="LastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Last Name *</FormLabel>
                  <FormControl>
                    <PrimaryInput placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="Email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Email *</FormLabel>
                <FormControl>
                  <PrimaryInput
                    type="email"
                    placeholder="you@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="PhoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Phone Number *</FormLabel>
                <FormControl>
                  <PrimaryInput
                    type="tel"
                    placeholder="Enter your phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="Password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">Password *</FormLabel>
                <FormControl>
                  <PrimaryInput
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ConfirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-medium">
                  Confirm Password *
                </FormLabel>
                <FormControl>
                  <PrimaryInput
                    type="password"
                    placeholder="Confirm your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* <div className="relative flex items-center">
            <div className="w-full border-t border-[#D4D4D4]"></div>
          </div> */}
          {/* <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2 p-4 border-[#D4D4D4] rounded-[5px] border-[1px] h-[52px] text-[16px] font-normal"
            type="button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              width="24px"
              height="24px"
            >
              <path
                fill="#FFC107"
                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
              />
              <path
                fill="#FF3D00"
                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
              />
              <path
                fill="#4CAF50"
                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
              />
              <path
                fill="#1976D2"
                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
              />
            </svg>
            Continue with Google
          </Button> */}
          <Link
            href="/auth/login"
            className="text-[#F9E8CD] text-base justify-self-end self-end mb-4"
          >
            Already have an account? Log in
          </Link>
          <Button
            type="submit"
            className="bg-[#F9E8CD] w-full py-[13px] h-full"
            disabled={isLoading}
          >
            {isLoading ? "Sending OTP..." : "Continue"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default SignUpForm;
