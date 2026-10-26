export type StoredProgressPhoto = {
  id: string;
  capturedAt: number;
  image: Blob;
};

const DB_NAME = "prime-private-media";
const STORE_NAME = "progress-photos";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Photo storage is unavailable in this browser."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("capturedAt", "capturedAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open photo storage."));
    request.onblocked = () => reject(new Error("Photo storage is busy in another PRIME window."));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Photo storage request failed."));
  });
}

export async function listProgressPhotos(): Promise<StoredProgressPhoto[]> {
  const database = await openDatabase();
  try {
    const photos = await requestResult(
      database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll(),
    );
    return (photos as StoredProgressPhoto[]).sort((a, b) => b.capturedAt - a.capturedAt);
  } finally {
    database.close();
  }
}

export async function saveProgressPhoto(photo: StoredProgressPhoto): Promise<void> {
  const database = await openDatabase();
  try {
    await requestResult(
      database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).put(photo),
    );
  } finally {
    database.close();
  }
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await requestResult(
      database.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME).delete(id),
    );
  } finally {
    database.close();
  }
}

/** Reduce very large camera images before saving, while keeping enough detail for comparisons. */
export async function prepareProgressPhoto(file: File): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;

  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file);
    const longestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, 1800 / longestSide);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not prepare that photo."))),
        "image/jpeg",
        0.88,
      );
    });
  } catch {
    // Keep a browser-decodable original rather than rejecting a valid user photo.
    return file;
  } finally {
    bitmap?.close();
  }
}
