"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Trash } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertModal } from "@/components/models/alert-modal";
import { apiErrorMessage } from "@/lib/utils";

type Addr = {
  id: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  country: string;
  pincode: string | null;
  landmark: string | null;
  isDefault: boolean;
};

interface AddressListProps {
  addresses: Addr[];
}

export const AddressList: React.FC<AddressListProps> = ({ addresses }) => {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!pendingId) return;
    try {
      setLoading(true);
      await axios.delete(`/api/addresses/${pendingId}`);
      toast.success("Address deleted");
      router.refresh();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to delete address"));
    } finally {
      setPendingId(null);
      setLoading(false);
    }
  };

  return (
    <section>
      <AlertModal
        isOpen={!!pendingId}
        onClose={() => setPendingId(null)}
        onConfirm={onDelete}
        loading={loading}
      />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Addresses</h3>
        <span className="text-xs text-muted-foreground">
          {addresses.length === 0 ? "No addresses on file" : `${addresses.length} on file`}
        </span>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          This user hasn't saved any shipping addresses yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <div key={a.id} className="border rounded-md p-4 space-y-1 text-sm">
              <div className="flex items-start justify-between">
                <div>
                  {a.isDefault && <Badge className="mb-2">Default</Badge>}
                  <p>{a.address1}</p>
                  {a.address2 && <p>{a.address2}</p>}
                  {a.landmark && <p className="text-muted-foreground">Near {a.landmark}</p>}
                  <p>
                    {a.city}, {a.state}
                    {a.pincode ? ` — ${a.pincode}` : ""}
                  </p>
                  <p className="text-muted-foreground">{a.country}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingId(a.id)}
                  disabled={loading}
                  title="Delete address"
                >
                  <Trash className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        Deletion is blocked if the address is referenced by an active order.
      </p>
    </section>
  );
};
