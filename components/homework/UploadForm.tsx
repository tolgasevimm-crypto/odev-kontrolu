"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, ImageIcon, X, Loader2, Plus } from "lucide-react";

const SUBJECTS = ["Matematik", "Türkçe", "Fen Bilgisi", "Sosyal Bilgiler", "İngilizce"] as const;

const schema = z.object({
  childId: z.string().min(1, "Çocuk seçin"),
  subject: z.string().min(1, "Ders seçin"),
});

type FormData = z.infer<typeof schema>;

interface Child {
  id: string;
  name: string;
  grade: number;
}

interface Props {
  children: Child[];
  defaultChildId?: string;
}

type Stage = "idle" | "uploading" | "analyzing" | "done";

export default function UploadForm({ children, defaultChildId }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);

  const { handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { childId: defaultChildId ?? "" },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const tooBig = selected.find((f) => f.size > 10 * 1024 * 1024);
    if (tooBig) {
      toast.error("Her dosya 10MB'dan küçük olmalıdır.");
      return;
    }

    const newPreviews = selected.map((f) => URL.createObjectURL(f));
    setFiles((prev) => [...prev, ...selected]);
    setPreviews((prev) => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormData) => {
    if (files.length === 0) {
      toast.error("Lütfen en az bir fotoğraf seçin.");
      return;
    }

    try {
      setStage("uploading");
      setProgress(20);

      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      formData.append("childId", data.childId);
      formData.append("subject", data.subject);

      const uploadRes = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        throw new Error(err.error ?? "Yükleme hatası");
      }

      const uploadData = await uploadRes.json() as { submissionId: string };
      const { submissionId } = uploadData;
      setProgress(50);
      setStage("analyzing");

      const analyzeRes = await fetch(`/api/submissions/${submissionId}/analyze`, {
        method: "POST",
      });

      if (!analyzeRes.ok) {
        const err = await analyzeRes.json();
        throw new Error(err.error ?? "Analiz hatası");
      }

      setProgress(100);
      setStage("done");
      toast.success("Analiz tamamlandı!");
      router.push(`/gecmis/${submissionId}`);
    } catch (err) {
      setStage("idle");
      setProgress(0);
      toast.error(err instanceof Error ? err.message : "Bir hata oluştu.");
    }
  };

  const isLoading = stage === "uploading" || stage === "analyzing";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Child Selector */}
      <div className="space-y-1">
        <Label>Çocuk</Label>
        <Select
          defaultValue={defaultChildId ?? undefined}
          onValueChange={(val) => typeof val === "string" && setValue("childId", val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Çocuk seçin" />
          </SelectTrigger>
          <SelectContent>
            {children.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} — {c.grade}. Sınıf
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.childId && <p className="text-sm text-red-500">{errors.childId.message}</p>}
      </div>

      {/* Subject Selector */}
      <div className="space-y-1">
        <Label>Ders</Label>
        <Select onValueChange={(val) => typeof val === "string" && setValue("subject", val)}>
          <SelectTrigger>
            <SelectValue placeholder="Ders seçin" />
          </SelectTrigger>
          <SelectContent>
            {SUBJECTS.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.subject && <p className="text-sm text-red-500">{errors.subject.message}</p>}
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label>Ödev Fotoğrafları {files.length > 0 && <span className="text-gray-400 font-normal">({files.length} sayfa)</span>}</Label>

        {/* Preview grid */}
        {previews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {previews.map((src, i) => (
              <Card key={i} className="relative overflow-hidden">
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1.5 right-1.5 z-10 bg-white rounded-full p-0.5 shadow hover:bg-gray-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <CardContent className="p-1.5">
                  <div className="relative h-36 w-full">
                    <Image src={src} alt={`Sayfa ${i + 1}`} fill className="object-contain rounded" />
                  </div>
                  <p className="text-xs text-center text-gray-400 mt-1">{i + 1}. sayfa</p>
                </CardContent>
              </Card>
            ))}

            {/* Add more button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 h-full min-h-[9rem] hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-gray-400"
            >
              <Plus className="w-6 h-6" />
              <span className="text-xs">Sayfa ekle</span>
            </button>
          </div>
        )}

        {/* Empty state */}
        {previews.length === 0 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center gap-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors text-gray-400"
          >
            <ImageIcon className="w-10 h-10" />
            <span className="text-sm">Fotoğraf seçmek için tıklayın</span>
            <span className="text-xs">JPEG, PNG — maks. 10MB/sayfa • Çok sayfalı ödev için birden fazla seçebilirsiniz</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Progress */}
      {isLoading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {stage === "uploading" ? "Fotoğraflar yükleniyor..." : "Yapay zeka analiz ediyor..."}
          </p>
        </div>
      )}

      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            İşleniyor...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Analiz Et
          </>
        )}
      </Button>
    </form>
  );
}
