import { useEffect, useState } from "react";
import { Camera, ImagePlus, Images, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  deleteProgressPhoto,
  listProgressPhotos,
  prepareProgressPhoto,
  saveProgressPhoto,
  type StoredProgressPhoto,
} from "@/lib/progress-photos";

type GalleryPhoto = StoredProgressPhoto & { url: string };

function formatPhotoDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(timestamp));
}

function createId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `photo-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  );
}

export function ProgressPhotoGallery() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [selected, setSelected] = useState<GalleryPhoto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProgressPhotos()
      .then((stored) => {
        if (!cancelled) {
          setPhotos(stored.map((photo) => ({ ...photo, url: URL.createObjectURL(photo.image) })));
        }
      })
      .catch(() => {
        if (!cancelled) toast.error("Progress photo storage could not be opened on this device");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => photos.forEach((photo) => URL.revokeObjectURL(photo.url)), [photos]);

  const addPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file for your progress log");
      return;
    }
    if (file.size > 40 * 1024 * 1024) {
      toast.error("Choose a photo smaller than 40 MB");
      return;
    }

    setSaving(true);
    try {
      const image = await prepareProgressPhoto(file);
      const saved: StoredProgressPhoto = { id: createId(), capturedAt: Date.now(), image };
      await saveProgressPhoto(saved);
      const photo = { ...saved, url: URL.createObjectURL(image) };
      setPhotos((current) => [photo, ...current].sort((a, b) => b.capturedAt - a.capturedAt));
      toast.success("Progress photo saved privately on this device");
    } catch {
      toast.error("Could not save that photo. Check available device storage and try again.");
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (photo: GalleryPhoto) => {
    if (!window.confirm("Delete this progress photo from this device? This cannot be undone."))
      return;
    try {
      await deleteProgressPhoto(photo.id);
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
      setSelected(null);
      toast.success("Progress photo deleted");
    } catch {
      toast.error("That photo could not be deleted");
    }
  };

  return (
    <section
      className="glass mb-5 overflow-hidden rounded-[1.8rem] p-4 sm:p-5"
      aria-labelledby="progress-photos-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Images className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              Private training journal
            </p>
            <h2 id="progress-photos-title" className="mt-1 text-xl leading-none">
              Progress photos
            </h2>
            <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
              Stored offline on this device. Photos are not uploaded or included in workout backups.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-primary/12 bg-primary/[0.05] px-2 py-1 text-[9px] font-bold text-primary">
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground transition-transform active:scale-[.98] ${saving ? "pointer-events-none opacity-60" : ""}`}
        >
          <ImagePlus className="h-4 w-4" /> {saving ? "Saving…" : "Choose photos"}
          <input
            type="file"
            accept="image/*"
            onChange={addPhoto}
            className="sr-only"
            disabled={saving}
          />
        </label>
        <label
          className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary/16 bg-primary/[0.045] px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/10 ${saving ? "pointer-events-none opacity-60" : ""}`}
        >
          <Camera className="h-4 w-4" /> Take photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={addPhoto}
            className="sr-only"
            disabled={saving}
          />
        </label>
      </div>

      {loading ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Opening your private photo log…
        </p>
      ) : photos.length ? (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setSelected(photo)}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl border border-border/70 bg-secondary text-left"
              aria-label={`View progress photo from ${formatPhotoDate(photo.capturedAt)}`}
            >
              <img
                src={photo.url}
                alt={`Progress photo, ${formatPhotoDate(photo.capturedAt)}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-2 pt-6 text-[9px] font-semibold text-white">
                {new Intl.DateTimeFormat(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                }).format(new Date(photo.capturedAt))}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.025] px-4 py-5 text-center">
          <p className="text-sm font-semibold">Your first check-in starts here</p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
            Add a photo whenever you want to compare your training journey over time.
          </p>
        </div>
      )}

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Progress photo from ${formatPhotoDate(selected.capturedAt)}`}
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div className="relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#101827] shadow-2xl">
            <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  Progress check-in
                </p>
                <p className="mt-0.5 text-sm font-semibold">
                  {formatPhotoDate(selected.capturedAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10"
                aria-label="Close photo"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-black/20">
              <img
                src={selected.url}
                alt={`Progress photo from ${formatPhotoDate(selected.capturedAt)}`}
                className="mx-auto max-h-[68vh] w-full object-contain"
              />
            </div>
            <div className="flex justify-end px-4 py-3">
              <button
                type="button"
                onClick={() => void removePhoto(selected)}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-300/20 px-3 text-xs font-semibold text-red-200 transition-colors hover:bg-red-300/10"
              >
                <Trash2 className="h-4 w-4" /> Delete photo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
