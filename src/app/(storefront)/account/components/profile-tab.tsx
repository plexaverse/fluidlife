"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiError } from "@/services/api-client";
import { updateProfile } from "@/services/profile";
import { useAuthStore } from "@/stores/auth-store";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ProfileTab() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [companyName, setCompanyName] = useState(user?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(user?.gstNumber ?? "");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const dirty =
    name !== (user.name ?? "") ||
    email !== (user.email ?? "") ||
    companyName !== (user.companyName ?? "") ||
    gstNumber !== (user.gstNumber ?? "");

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (email && !EMAIL_REGEX.test(email)) {
      toast.error("Invalid email");
      return;
    }
    setLoading(true);
    try {
      const updated = await updateProfile(user.id, {
        name: name.trim(),
        email: email.trim(),
        companyName: companyName.trim() || null,
        gstNumber: gstNumber.trim() || null,
      });
      setUser({ ...user, ...updated });
      toast.success("Profile updated");
    } catch (e) {
      toast.error(apiError(e, "Could not update profile").message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSave} className="rounded-2xl border bg-card p-6 max-w-2xl space-y-5">
      <header>
        <h3 className="text-lg font-semibold">Profile details</h3>
        <p className="text-sm text-muted-foreground">
          Update your contact info. Phone changes aren&apos;t supported here —
          contact support if you need to switch numbers.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (immutable)</Label>
          <Input id="phone" value={user.phone} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="role">Account type</Label>
          <Input id="role" value={user.role} disabled />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="company">Company name</Label>
          <Input
            id="company"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="gst">GSTIN</Label>
          <Input
            id="gst"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            disabled={loading}
          />
        </div>
      </div>

      {user.role === "DISTRIBUTOR" && (
        <>
          <Separator />
          <div className="text-sm">
            <p className="font-medium mb-1">Distributor credit</p>
            <p className="text-muted-foreground">
              Approval status: <strong className={user.isApproved ? "text-emerald-600" : "text-amber-600"}>
                {user.isApproved ? "Approved" : "Pending approval"}
              </strong>
            </p>
            {user.creditLimit !== null && (
              <p className="text-muted-foreground mt-1">
                Credit usage: ₹{Number(user.creditUsed).toFixed(2)} of ₹{Number(user.creditLimit).toFixed(2)}
              </p>
            )}
          </div>
        </>
      )}

      <div className="pt-2">
        <Button type="submit" disabled={loading || !dirty}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
