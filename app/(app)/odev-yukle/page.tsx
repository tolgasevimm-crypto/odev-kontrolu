import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UploadForm from "@/components/homework/UploadForm";

interface Props {
  searchParams: Promise<{ childId?: string }>;
}

export default async function OdevYuklePage({ searchParams }: Props) {
  const { childId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: children } = await supabase
    .from("children")
    .select("id, name, grade")
    .eq("parent_id", user!.id)
    .order("created_at", { ascending: true });

  if (!children || children.length === 0) {
    redirect("/cocuklar/yeni");
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ödev Yükle</h1>
      <UploadForm children={children} defaultChildId={childId} />
    </div>
  );
}
