"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Loader2, Plus, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiError } from "@/services/api-client";
import { deleteAddress, listAddresses, updateAddress } from "@/services/addresses";
import type { Address } from "@/types/storefront";

import { AddressForm } from "@/app/(storefront)/checkout/components/address-form";

export function AddressesTab() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listAddresses();
      setAddresses(list);
    } catch (e) {
      toast.error(apiError(e, "Could not load addresses").message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onSetDefault = async (a: Address) => {
    if (a.isDefault) return;
    setPending(a.id);
    try {
      // Mark this one default; backend will not auto-clear others (no transaction
      // for that operation today), but UX shows the latest "Default" badge.
      // If you need exclusivity, surface it via a future addresses-bulk endpoint.
      await updateAddress(a.id, { isDefault: true });
      toast.success("Default address updated");
      setAddresses((prev) =>
        prev.map((x) => ({ ...x, isDefault: x.id === a.id }))
      );
    } catch (e) {
      toast.error(apiError(e, "Could not update address").message);
    } finally {
      setPending(null);
    }
  };

  const onDelete = async (a: Address) => {
    if (!confirm("Delete this address?")) return;
    setPending(a.id);
    try {
      await deleteAddress(a.id);
      toast.success("Address deleted");
      setAddresses((prev) => prev.filter((x) => x.id !== a.id));
    } catch (e) {
      toast.error(apiError(e, "Could not delete address").message);
    } finally {
      setPending(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading addresses…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Saved shipping addresses — used at checkout.
        </p>
        {!adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add address
          </Button>
        )}
      </div>

      {adding && (
        <div className="rounded-2xl border bg-card p-5">
          <h3 className="font-medium mb-3">New shipping address</h3>
          <AddressForm
            onCreated={(a) => {
              setAddresses((prev) => [a, ...prev]);
              setAdding(false);
              toast.success("Address added");
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <p className="text-lg font-medium mb-2">No saved addresses</p>
          <p className="text-sm text-muted-foreground mb-6">
            Add one so checkout is one click next time.
          </p>
          <Button onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add address
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <li
              key={a.id}
              className={cn(
                "rounded-2xl border bg-card p-5 space-y-3",
                a.isDefault && "ring-2 ring-primary/30"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm">
                  <p className="font-medium">
                    {a.address1}
                    {a.address2 ? `, ${a.address2}` : ""}
                  </p>
                  {a.landmark && (
                    <p className="text-muted-foreground">Near {a.landmark}</p>
                  )}
                  <p>
                    {a.city}, {a.state}
                    {a.pincode ? ` — ${a.pincode}` : ""}
                  </p>
                  <p className="text-muted-foreground">{a.country}</p>
                </div>
                {a.isDefault && <Badge>Default</Badge>}
              </div>
              <div className="flex flex-wrap gap-2 pt-1 border-t">
                {!a.isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSetDefault(a)}
                    disabled={pending === a.id}
                  >
                    <Star className="h-4 w-4 mr-1" /> Set as default
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => onDelete(a)}
                  disabled={pending === a.id}
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
