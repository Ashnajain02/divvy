// Divvy icon set. One consistent visual language: 24×24 viewBox, 1.7 stroke,
// rounded joins, `currentColor`. No emoji anywhere in the product UI.

type IconProps = { className?: string };

function Svg({
  className = "h-5 w-5",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function CameraIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 8.5A2 2 0 0 1 5 6.5h1.2a1 1 0 0 0 .82-.43l.86-1.24a1 1 0 0 1 .82-.43h4.56a1 1 0 0 1 .82.43l.86 1.24a1 1 0 0 0 .82.43H17a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
      <circle cx="11" cy="12.5" r="3.2" />
    </Svg>
  );
}

export function PhotosIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="M4 17l4.5-4.2a1.5 1.5 0 0 1 2 0L15 16m-1.5-1.5l2-1.8a1.5 1.5 0 0 1 2 0L20 14.5" />
    </Svg>
  );
}

export function FolderIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M3 7a2 2 0 0 1 2-2h3.6a1 1 0 0 1 .7.3l1.4 1.4a1 1 0 0 0 .7.3H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </Svg>
  );
}

export function ScanIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 8V6.5A2.5 2.5 0 0 1 6.5 4H8M16 4h1.5A2.5 2.5 0 0 1 20 6.5V8M20 16v1.5a2.5 2.5 0 0 1-2.5 2.5H16M8 20H6.5A2.5 2.5 0 0 1 4 17.5V16" />
      <path d="M4 12h16" />
    </Svg>
  );
}

export function ReceiptIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 3.5h12a1 1 0 0 1 1 1V20l-2.2-1.3-2.2 1.3-2.3-1.3-2.3 1.3L7.5 18.7 5 20V4.5a1 1 0 0 1 1-1Z" />
      <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
    </Svg>
  );
}

export function ShareIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" />
      <path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </Svg>
  );
}

export function SendIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M21 3 10.5 13.5M21 3l-6.8 18a.5.5 0 0 1-.94.02l-3.2-7.7-7.7-3.2a.5.5 0 0 1 .02-.94L21 3Z" />
    </Svg>
  );
}

export function ChevronDownIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

export function ChevronLeftIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m15 5-7 7 7 7" />
    </Svg>
  );
}

export function CheckIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="m5 12.5 4.5 4.5L19 6.5" />
    </Svg>
  );
}

export function CircleIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8.2" />
    </Svg>
  );
}

export function PlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Svg>
  );
}

export function MoreIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </Svg>
  );
}

// Indicator that precedes a nested add-on row (corner-down-right).
export function AddOnIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 6v6a2 2 0 0 0 2 2h8m0 0-3-3m3 3-3 3" />
    </Svg>
  );
}

// "Group under another item" — merge a row into a parent.
export function GroupIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="6" rx="1.5" />
      <path d="M9 14h7a2 2 0 0 1 2 2v2m0 0-2.2-2.2M18 18l-2.2 2.2" />
    </Svg>
  );
}

// "Ungroup" — pop an add-on back out to its own row (corner-up-left).
export function UngroupIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M17 18v-6a2 2 0 0 0-2-2H7m0 0 3-3m-3 3 3 3" />
    </Svg>
  );
}

// "Split into two".
export function SplitIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4v16" />
      <path d="M8 8 5 12l3 4M16 8l3 4-3 4" />
    </Svg>
  );
}

export function UserPlusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <circle cx="9" cy="8" r="3.3" />
      <path d="M3.6 19.2a5.5 5.5 0 0 1 10.8 0" />
      <path d="M18.5 8.5v5M16 11h5" />
    </Svg>
  );
}

export function AlertIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M12 4.5 2.8 20a1 1 0 0 0 .87 1.5h16.66a1 1 0 0 0 .87-1.5L12 4.5Z" />
      <path d="M12 10v4.5" />
      <circle cx="12" cy="17.6" r="0.6" fill="currentColor" />
    </Svg>
  );
}

export function MinusIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 12h14" />
    </Svg>
  );
}

export function TrashIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 7h16M9 7V5.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5.5V7m2 0v11.5a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 7 18.5V7" />
      <path d="M10 11v5M14 11v5" />
    </Svg>
  );
}

// Tax/tip split mode glyphs.
export function EqualIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 9.5h14M5 14.5h14" />
    </Svg>
  );
}

export function PercentIcon(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6.5 17.5 17.5 6.5" />
      <circle cx="7.5" cy="7.5" r="2" />
      <circle cx="16.5" cy="16.5" r="2" />
    </Svg>
  );
}
