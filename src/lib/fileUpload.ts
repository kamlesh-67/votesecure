import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Server-side only — uses service role key for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type StorageBucket = "candidates" | "symbols";

/**
 * Optimizes an image with Sharp (resize + WebP), then uploads to Supabase Storage.
 * Returns the public URL of the uploaded file.
 *
 * @param file     - Raw file Buffer
 * @param filename - Base filename (without extension)
 * @param bucket   - "candidates" (photos) or "symbols" (party symbols)
 */
export async function uploadCandidatePhoto(
  file: Buffer,
  filename: string,
  bucket: StorageBucket,
): Promise<string> {
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
    const url = new URL(publicUrl);
    // Path format: /storage/v1/object/public/<bucket>/<filename>
    const parts = url.pathname.split(`/${bucket}/`);
    if (parts.length < 2) return;
    const filePath = parts[1];

    await supabase.storage.from(bucket).remove([filePath]);
  } catch {
    console.error("[fileUpload] Failed to delete storage file:", publicUrl);
  }
}
