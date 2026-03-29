import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

/**
 * Lazy-initializes the Supabase client only when needed.
 * This prevents the build from failing due to missing environment variables
 * during page data collection/pre-rendering.
 */
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) are missing. " +
      "If you are in Demo Mode, these are required only for actual image uploads."
    );
  }

  return createClient(url, key);
}

type StorageBucket = "candidates" | "symbols";

/**
 * Optimizes an image with Sharp (resize + WebP), then uploads to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadCandidatePhoto(
  file: Buffer,
  filename: string,
  bucket: StorageBucket,
): Promise<string> {
  const supabase = getSupabaseClient();
  
  const resizeOptions =
    bucket === "candidates"
      ? { width: 400, height: 400 }
      : { width: 200, height: 200 };

  // Resize and convert to WebP
  const optimized = await sharp(file)
    .resize(resizeOptions.width, resizeOptions.height, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();

  const path = `${Date.now()}-${filename.replace(/[^a-z0-9]/gi, "_")}.webp`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, optimized, {
      contentType: "image/webp",
      upsert: false,
    });

  if (error) throw new Error(`Upload to "${bucket}" failed: ${error.message}`);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Deletes a file from Supabase Storage given its public URL.
 * Extracts the path from the URL automatically.
 */
export async function deleteStorageFile(
  publicUrl: string,
  bucket: StorageBucket,
): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(publicUrl);
    // Path format: /storage/v1/object/public/<bucket>/<filename>
    const parts = url.pathname.split(`/${bucket}/`);
    if (parts.length < 2) return;
    const filePath = parts[1];

    await supabase.storage.from(bucket).remove([filePath]);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Supabase environment variables")) {
      console.warn("[fileUpload] Skipping deletion: Supabase credentials missing (Demo Mode?).");
      return;
    }
    console.error("[fileUpload] Failed to delete storage file:", publicUrl);
  }
}
