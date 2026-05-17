"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { apiError } from "@/services/api-client";
import { listAddresses } from "@/services/addresses";
import type { Address } from "@/types/storefront";

import { AddressForm } from "./address-form";

interface AddressSelectorProps {
  selectedId: string | null;
  onSelect: (a: Address) => void;
}

export function AddressSelector({ selectedId, onSelect }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await listAddresses();
      setAddresses(list);
      // If nothing selected yet, auto-select the default (or first).
      if (!selectedId && list.length > 0) {
        const def = list.find((a) => a.isDefault) ?? list[0];
        onSelect(def);
      }
    } catch (e) {
      toast.error(apiError(e, "Could not load addresses").message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading your addresses…
      </div>
    );
  }

  if (adding) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-medium mb-3">Add a new address</h3>
        <AddressForm
          onCreated={(a) => {
            setAddresses((prev) => [a, ...prev]);
            onSelect(a);
            setAdding(false);
          }}
          onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
        />
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-medium mb-3">Add a shipping address</h3>
        <AddressForm onCreated={(a) => setAddresses([a]) || onSelect(a)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {addresses.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => onSelect(a)}
              className={cn(
                "w-full text-left rounded-xl border bg-card p-4 transition-colors",
                selectedId === a.id ? "border-primary ring-2 ring-primary/20" : "hover:border-muted-foreground/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-sm flex-1">
                  <p>
                    {a.address1}
                    {a.address2 ? `, ${a.address2}` : ""}
                  </p>
                  {a.landmark && <p className="text-muted-foreground">Near {a.landmark}</p>}
                  <p>
                    {a.city}, {a.state}
                    {a.pincode ? ` — ${a.pincode}` : ""}
                  </p>
                  <p className="text-muted-foreground">{a.country}</p>
                </div>
                {a.isDefault && <Badge variant="secondary">Default</Badge>}
              </div>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={() => setAdding(true)}>
        <Plus className="h-4 w-4 mr-1" /> Add new address
      </Button>
    </div>
  );
}
