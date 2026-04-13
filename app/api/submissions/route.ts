import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { SubjectType } from "@/types/database";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_SIZE = 10 * 1024 * 1024;
const SUBJECTS: SubjectType[] = ["Matematik", "Türkçe", "Fen Bilgisi", "Sosyal Bilgiler", "İngilizce"];

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const childId = searchParams.get("childId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("homework_submissions")
    .select("id, child_id, subject, status, submitted_at, image_url, children!inner(name)", { count: "exact" })
    .eq("parent_id", user.id)
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (childId) query = query.eq("child_id", childId);

  const { data: submissions, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch scores separately
  const ids = (submissions ?? []).map((s) => s.id);
  const { data: scores } = ids.length
    ? await supabase
        .from("analyses")
        .select("submission_id, score_percentage")
        .in("submission_id", ids)
    : { data: [] };

  const scoreMap = new Map((scores ?? []).map((s) => [s.submission_id, s.score_percentage]));

  const result = (submissions ?? []).map((s) => ({
    id: s.id,
    child_id: s.child_id,
    child_name: (s.children as unknown as { name: string }).name,
    subject: s.subject,
    status: s.status,
    score_percentage: scoreMap.get(s.id) ?? null,
    submitted_at: s.submitted_at,
    image_url: s.image_url,
  }));

  return NextResponse.json({ submissions: result, total: count ?? 0, page });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const serviceClient = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const formData = await request.formData();
  const rawImages = formData.getAll("images") as File[];
  const childId = formData.get("childId") as string | null;
  const subject = formData.get("subject") as SubjectType | null;

  if (!rawImages.length || !childId || !subject) {
    return NextResponse.json({ error: "Eksik alanlar: images, childId, subject" }, { status: 400 });
  }

  for (const file of rawImages) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Desteklenmeyen dosya türü. JPEG, PNG veya HEIC yükleyin." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Her dosya 10MB'dan küçük olmalıdır." }, { status: 400 });
    }
  }

  if (!SUBJECTS.includes(subject)) {
    return NextResponse.json({ error: "Geçersiz ders." }, { status: 400 });
  }

  const { data: child, error: childError } = await supabase
    .from("children")
    .select("id, grade")
    .eq("id", childId)
    .eq("parent_id", user.id)
    .single();

  if (childError || !child) {
    return NextResponse.json({ error: "Çocuk bulunamadı." }, { status: 404 });
  }

  // Upload all images and collect paths
  const submissionUuid = crypto.randomUUID();
  const imagePaths: string[] = [];

  for (const file of rawImages) {
    const ext = file.type === "image/heic" || file.type === "image/heif"
      ? "heic"
      : (file.name.split(".").pop() ?? "jpg");
    const imagePath = `${user.id}/${childId}/${submissionUuid}/${imagePaths.length}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await serviceClient.storage
      .from("homework-images")
      .upload(imagePath, buffer, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: "Görsel yüklenemedi: " + uploadError.message }, { status: 500 });
    }

    imagePaths.push(imagePath);
  }

  // Create signed URL for first image (used as thumbnail)
  const { data: signedUrlData } = await serviceClient.storage
    .from("homework-images")
    .createSignedUrl(imagePaths[0], 3600);

  const imageUrl = signedUrlData?.signedUrl ?? "";
  // Store all paths as JSON string in image_path, first path for thumbnail
  const imagePathStored = imagePaths.length === 1 ? imagePaths[0] : JSON.stringify(imagePaths);

  const { data: submission, error: dbError } = await serviceClient
    .from("homework_submissions")
    .insert({
      child_id: childId,
      parent_id: user.id,
      subject,
      grade_at_time: child.grade,
      image_path: imagePathStored,
      image_url: imageUrl,
      status: "pending",
    })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ submissionId: submission.id, imageUrl }, { status: 201 });
}
