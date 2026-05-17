"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiError } from "@/services/api-client";
import { createAddress, type AddressInput } from "@/services/addresses";
import type { Address } from "@/types/storefront";

interface AddressFormProps {
  onCreated: (a: Address) => void;
  onCancel?: () => void;
}

/**
 * Minimal address form for checkout. All fields except address2/landmark
 * are required by the POST /api/addresses route.
 */
export function AddressForm({ onCreated, onCancel }: AddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<AddressInput>({
    address1: "",
    address2: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    landmark: "",
    isDefault: false,
  });

  const update = (k: keyof AddressInput, v: string | boolean) =>
    setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const a = await createAddress({
        ...form,
        address1: form.address1.trim(),
        address2: form.address2?.trim() || undefined,
        city: form.city.trim(),
        state: form.state.trim(),
        country: form.country.trim(),
        pincode: form.pincode?.trim() || undefined,
        landmark: form.landmark?.trim() || undefined,
      });
      toast.success("Address saved");
      onCreated(a);
    } catch (e) {
      toast.error(apiError(e, "Could not save address").message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="addr1">Address line 1 *</Label>
          <Input
            id="addr1"
            required
            value={form.address1}
            onChange={(e) => update("address1", e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="addr2">Address line 2</Label>
          <Input
            id="addr2"
            value={form.address2}
            onChange={(e) => update("address2", e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            required
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state">State *</Label>
          <Input
            id="state"
            required
            value={form.state}
            onChange={(e) => update("state", e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pincode">Pincode *</Label>
          <Input
            id="pincode"
            required
            inputMode="numeric"
            value={form.pincode}
            onChange={(e) =>
              update("pincode", e.target.value.replace(/[^\d]/g, "").slice(0, 6))
            }
            disabled={loading}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="country">Country *</Label>
          <Input
            id="country"
            required
            value={form.country}
            onChange={(e) => update("country", e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="sm:col-span-2 space-y-1">
          <Label htmlFor="landmark">Landmark</Label>
          <Input
            id="landmark"
            value={form.landmark}
            onChange={(e) => update("landmark", e.target.value)}
            disabled={loading}
          />
        </div>
        <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!form.isDefault}
            onChange={(e) => update("isDefault", e.target.checked)}
            disabled={loading}
          />
          Use this as my default shipping address
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save address"}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
