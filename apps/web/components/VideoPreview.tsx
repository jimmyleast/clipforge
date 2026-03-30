'use client';

interface VideoPreviewProps {
  url: string;
  onClose: () => void;
}

export default function VideoPreview({ url, onClose }: VideoPreviewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm"
        >
          Close [ESC]
        </button>
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-lg shadow-2xl"
        />
      </div>
    </div>
  );
}
