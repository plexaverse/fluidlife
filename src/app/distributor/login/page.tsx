"use client";

import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { apiErrorMessage } from "@/lib/utils";

export default function DistributorLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/auth/sendotp", { phone });
      toast.success("OTP sent");
      setStep("otp");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Failed to send OTP"));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/auth/verifyotp", { phone, code });
      await axios.post("/api/distributor/session", { token: data.token });
      toast.success("Signed in");
      router.push("/distributor/dashboard");
      router.refresh();
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? "";
      if (msg.includes("distributor")) {
        toast.error("This portal is for distributor accounts only");
      } else {
        toast.error(apiErrorMessage(err, "Invalid OTP"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-black">
      <div className="w-full max-w-sm p-8 bg-white dark:bg-neutral-900 border rounded-xl shadow-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Distributor Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Fluidlife</p>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mobile number</label>
              <input
                type="tel"
                placeholder="10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                className="w-full border rounded-md p-2 text-sm dark:bg-black dark:border-neutral-700"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-neutral-400">
              OTP sent to <span className="font-medium">{phone}</span>.{" "}
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-blue-600 hover:underline"
              >
                Change
              </button>
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Enter OTP</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full border rounded-md p-2 text-sm tracking-widest dark:bg-black dark:border-neutral-700"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-2 rounded-md text-sm font-medium hover:bg-neutral-800 transition disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Verifying…" : "Sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
