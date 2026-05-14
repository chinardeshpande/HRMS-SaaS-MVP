interface BrandedScreenshotProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export default function BrandedScreenshot({
  src,
  alt,
  className = '',
  imageClassName = '',
}: BrandedScreenshotProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img src={src} alt={alt} className={imageClassName} />
      <div className="absolute left-3 top-3 rounded-md border border-gray-200 bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
        <img src="/images/aurorahr-logo-primary.svg" alt="" className="h-5 w-auto" />
      </div>
    </div>
  );
}
