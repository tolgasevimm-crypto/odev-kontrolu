"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalı").max(100),
  grade: z.string().min(1, "Sınıf seçin"),
});

type FormData = z.infer<typeof schema>;

const grades = [
  { value: "1", label: "1. Sınıf (İlkokul)" },
  { value: "2", label: "2. Sınıf (İlkokul)" },
  { value: "3", label: "3. Sınıf (İlkokul)" },
  { value: "4", label: "4. Sınıf (İlkokul)" },
  { value: "5", label: "5. Sınıf (Ortaokul)" },
  { value: "6", label: "6. Sınıf (Ortaokul)" },
  { value: "7", label: "7. Sınıf (Ortaokul)" },
  { value: "8", label: "8. Sınıf (Ortaokul)" },
];

export default function YeniCocukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, grade: parseInt(data.grade) }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Hata oluştu");
      }

      toast.success(`${data.name} profili oluşturuldu!`);
      router.push("/cocuklar");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <Link href="/cocuklar" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Yeni Çocuk Profili</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Çocuğun Adı</Label>
              <Input id="name" placeholder="Örn: Ahmet" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Sınıf Seviyesi</Label>
              <Select onValueChange={(val) => typeof val === "string" && setValue("grade", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sınıf seçin" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g.value} value={g.value}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.grade && (
                <p className="text-sm text-red-500">{errors.grade.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? "Oluşturuluyor..." : "Profil Oluştur"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
