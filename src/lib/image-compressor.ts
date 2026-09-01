/**
 * Client-side image compressor using Canvas.
 * Resizes images to a maximum width/height while maintaining aspect ratio,
 * and compresses them to WebP/JPEG format to save bandwidth and storage.
 */
export async function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.8
): Promise<File> {
  // Only compress images
  if (!file.type.startsWith("image/")) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate the new dimensions while maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file); // Fallback to original if canvas fails
          return;
        }

        // Draw the resized image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Blob and then to File
        const outFormat = file.type === "image/png" ? "image/png" : "image/webp";
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + (outFormat === "image/webp" ? ".webp" : ".png"), {
                type: outFormat,
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              resolve(file);
            }
          },
          outFormat,
          quality
        );
      };
      img.onerror = () => resolve(file); // Fallback on error
    };
    reader.onerror = () => resolve(file);
  });
}
