"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeleteChildButton({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Silinemedi");
      toast.success(`${childName} profili silindi.`);
      router.push("/cocuklar");
    } catch {
      toast.error("Profil silinemedi.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profili Sil</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            <strong>{childName}</strong> profilini ve tüm ödev geçmişini silmek istediğinize
            emin misiniz? Bu işlem geri alınamaz.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? "Siliniyor..." : "Sil"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
