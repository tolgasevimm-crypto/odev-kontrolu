import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Upload } from "lucide-react";
import ChildDashboard from "@/components/dashboard/ChildDashboard";
import DeleteChildButton from "@/components/children/DeleteChildButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChildPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: child } = await supabase
    .from("children")
    .select("*")
    .eq("id", id)
    .eq("parent_id", user!.id)
    .single();

  if (!child) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/cocuklar" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-indigo-700 font-bold">
                {child.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{child.name}</h1>
              <Badge variant="secondary">{child.grade}. Sınıf</Badge>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Link href={`/odev-yukle?childId=${child.id}`}>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Ödev Yükle
            </Button>
          </Link>
          <DeleteChildButton childId={child.id} childName={child.name} />
        </div>
      </div>

      <ChildDashboard childId={child.id} />
    </div>
  );
}
