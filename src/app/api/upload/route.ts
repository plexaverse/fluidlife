import { createClient } from "@supabase/supabase-js";
import { requireAdmin, isResponse } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { env } from "@/lib/env";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (isResponse(auth)) return auth;

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return apiError("BAD_REQUEST", "file field is required");
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { error } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return apiError("INTERNAL", error.message);
  }

  const { data } = supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(path);

  return Response.json({ url: data.publicUrl });
}
