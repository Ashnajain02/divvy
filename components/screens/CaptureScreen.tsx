"use client";

import { useRef, useState } from "react";
import {
  BackButton,
  Button,
  NavBar,
  Spinner,
  StickyBar,
  type as T,
} from "@/components/ui";
import { CameraIcon, FolderIcon, PhotosIcon, ScanIcon } from "@/components/icons";
import { fileToNormalizedDataUrl } from "@/lib/image";

export default function CaptureScreen({
  onBack,
  onReadReceipt,
}: {
  onBack: () => void;
  onReadReceipt: (imageDataUrl: string) => void;
}) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const dataUrl = await fileToNormalizedDataUrl(file);
      setImage(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load that photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-full">
      <NavBar title="Scan Receipt" left={<BackButton onClick={onBack} />} />

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />

      <div className="mx-auto flex min-h-[calc(100dvh-3.5rem)] max-w-3xl flex-col px-6 pb-40 pt-6">
        {!image ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gold/12">
              <ScanIcon className="h-9 w-9 text-gold" />
            </div>
            <p className={`${T.headline} mt-5 text-text-primary`}>
              Capture your receipt
            </p>
            <p className={`${T.body} mt-1 text-text-secondary`}>
              Take a photo or choose from your files
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt="Receipt preview"
              className="max-h-[58dvh] w-auto rounded-[14px] shadow-[0_3px_8px_rgba(0,0,0,0.15)]"
            />
            <button
              onClick={() => libraryRef.current?.click()}
              className={`${T.label} mt-4 text-primary-light underline-offset-4 hover:underline`}
            >
              Choose a different photo
            </button>
          </div>
        )}

        {error && (
          <p className={`${T.caption} mt-4 text-center text-destructive`}>{error}</p>
        )}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-[14px] bg-card px-8 py-6 shadow-[0_3px_8px_rgba(0,0,0,0.2)]">
            <Spinner />
            <span className={`${T.body} text-text-secondary`}>Loading photo…</span>
          </div>
        </div>
      )}

      <StickyBar>
        {!image ? (
          <>
            <Button onClick={() => cameraRef.current?.click()}>
              <CameraIcon /> Take Photo
            </Button>
            <Button variant="secondary" onClick={() => libraryRef.current?.click()}>
              <PhotosIcon /> Photo Library
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <FolderIcon /> Browse Files
            </Button>
          </>
        ) : (
          <Button onClick={() => onReadReceipt(image)}>
            <ScanIcon /> Read Receipt
          </Button>
        )}
      </StickyBar>
    </main>
  );
}
