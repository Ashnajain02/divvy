// Divvy logo. Renders the real brand asset shipped at /public/divvy-logo.png.
// The source image is a full-bleed indigo square, so callers round the corners
// via className (overflow is clipped by border-radius + object-cover).

type Props = { className?: string; title?: string };

export default function Logo({ className = "h-10 w-10", title = "Divvy" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/divvy-logo.png"
      alt={title}
      className={`object-cover ${className}`}
      draggable={false}
    />
  );
}
