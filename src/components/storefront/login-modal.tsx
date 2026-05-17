"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiError } from "@/services/api-client";
import { sendOtp, verifyOtp } from "@/services/auth";
import { useAuthStore } from "@/stores/auth-store";
import { useUIStore } from "@/stores/ui-store";

const PHONE_REGEX = /^[1-9]\d{9,14}$/;
const RESEND_COOLDOWN_S = 30;

type Step = "phone" | "otp";

export function LoginModal() {
  const open = useUIStore((s) => s.loginModalOpen);
  const close = useUIStore((s) => s.closeLoginModal);
  const setAuth = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Reset everything when the modal closes.
  useEffect(() => {
    if (!open) {
      setStep("phone");
      setPhone("");
      setCode("");
      setLoading(false);
      setResendIn(0);
    }
  }, [open]);

  // Resend cooldown countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Autofocus the OTP input when we switch steps.
  useEffect(() => {
    if (step === "otp") {
      const id = setTimeout(() => otpInputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [step]);

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!PHONE_REGEX.test(trimmed)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(trimmed);
      toast.success("OTP sent. Check your messages.");
      setStep("otp");
      setResendIn(RESEND_COOLDOWN_S);
    } catch (e) {
      toast.error(apiError(e, "Failed to send OTP").message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{4,8}$/.test(code)) {
      toast.error("Enter the OTP you received");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOtp(phone.trim(), code);
      setAuth({
        token: res.token,
        refreshToken: res.refreshToken,
        expiry: res.expiry,
        user: res.user,
      });
      toast.success(`Welcome${res.user.name ? `, ${res.user.name.split(" ")[0]}` : ""}`);
      close();
    } catch (e) {
      toast.error(apiError(e, "Invalid OTP").message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    setLoading(true);
    try {
      await sendOtp(phone.trim());
      toast.success("OTP resent");
      setResendIn(RESEND_COOLDOWN_S);
    } catch (e) {
      toast.error(apiError(e, "Failed to resend OTP").message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "phone" ? "Sign in to Fluidlife" : "Verify your phone"}
          </DialogTitle>
          <DialogDescription>
            {step === "phone"
              ? "We'll text you a one-time code. No password needed."
              : `Enter the 6-digit code we sent to +91 ${phone}.`}
          </DialogDescription>
        </DialogHeader>

        {step === "phone" ? (
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOtp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                autoFocus
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, "").slice(0, 15))}
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our{" "}
              <a href="/terms-of-service" className="underline">
                terms
              </a>{" "}
              and{" "}
              <a href="/privacy-policy" className="underline">
                privacy policy
              </a>
              .
            </p>
          </form>
        ) : (
          <form
            className="space-y-4 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyOtp();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                ref={otpInputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Enter the code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^\d]/g, "").slice(0, 8))}
                disabled={loading}
                className="tracking-widest text-center text-lg"
              />
            </div>
            <Button type="submit" disabled={loading || code.length < 4} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
            </Button>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="underline-offset-2 hover:underline disabled:no-underline disabled:opacity-50"
                onClick={handleResend}
                disabled={loading || resendIn > 0}
              >
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend OTP"}
              </button>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setStep("phone")}
                disabled={loading}
              >
                Change number
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
