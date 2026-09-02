import { useState } from "react";

interface PreviewImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback: React.ReactNode;
}

export function PreviewImage({ src, fallback, ...props }: PreviewImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return <>{fallback}</>;
  }

  return (
    <img
      src={src}
      onError={() => setError(true)}
      {...props}
    />
  );
}
