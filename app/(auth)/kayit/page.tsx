"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const schema = z
  .object({
    full_name: z.string().min(2, "Ad Soyad en az 2 karakter olmalı"),
    email: z.string().email("Geçerli bir e-posta adresi girin"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Şifreler eşleşmiyor",
    path: ["confirm_password"],
  });

type FormData = z.infer<typeof schema>;

export default function KayitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.full_name },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Kayıt başarılı! Lütfen e-postanızı onaylayın.");
      router.push("/giris?registered=true");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Kayıt sırasında hata oluştu.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Hesap Oluştur</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="full_name">Ad Soyad</Label>
            <Input id="full_name" placeholder="Ayşe Yılmaz" {...register("full_name")} />
            {errors.full_name && (
              <p className="text-sm text-red-500">{errors.full_name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">E-posta</Label>
            <Input id="email" type="email" placeholder="ornek@email.com" {...register("email")} />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">Şifre</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirm_password">Şifre Tekrar</Label>
            <Input id="confirm_password" type="password" {...register("confirm_password")} />
            {errors.confirm_password && (
              <p className="text-sm text-red-500">{errors.confirm_password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
          </Button>
          <p className="text-sm text-gray-500">
            Hesabınız var mı?{" "}
            <Link href="/giris" className="text-indigo-600 hover:underline">
              Giriş yapın
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
