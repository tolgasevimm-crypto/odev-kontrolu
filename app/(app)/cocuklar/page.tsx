import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, User, ChevronRight } from "lucide-react";

export default async function CocuklarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: children } = await supabase
    .from("children")
    .select("*")
    .eq("parent_id", user!.id)
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Çocuklarım</h1>
        <Link href="/cocuklar/yeni">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Çocuk Ekle
          </Button>
        </Link>
      </div>

      {!children || children.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">Henüz çocuk profili eklenmemiş.</p>
          <Link href="/cocuklar/yeni">
            <Button variant="outline" className="mt-4">
              İlk Profili Ekle
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <Link key={child.id} href={`/cocuklar/${child.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-700 font-bold text-lg">
                        {child.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{child.name}</p>
                      <Badge variant="secondary" className="mt-1">
                        {child.grade}. Sınıf
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
