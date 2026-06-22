export type StoredImage = {
  id: string;
  blob: Blob;
  name: string;
  createdAt: number;
  originalSize: number;
  compressedSize: number;
  mimeType: string;
};

export type StoredImageMetadata = Omit<StoredImage, 'blob'>;

const dbName = 'MarkdownKitsImages';
const storeName = 'images';

export class ImageStore {
  private db: IDBDatabase | null = null;
  private objectUrls = new Map<string, string>();

  async init() {
    if (this.db) return;
    this.db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt');
          store.createIndex('name', 'name');
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async save(blob: Blob, metadata: Omit<StoredImage, 'blob' | 'createdAt' | 'compressedSize'>) {
    await this.init();
    this.revokeObjectUrl(metadata.id);
    const image: StoredImage = {
      ...metadata,
      blob,
      createdAt: Date.now(),
      compressedSize: blob.size
    };

    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).put(image);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getBlob(id: string) {
    await this.init();
    return new Promise<Blob | null>((resolve, reject) => {
      const request = this.db!.transaction(storeName).objectStore(storeName).get(id);
      request.onsuccess = () => resolve((request.result as StoredImage | undefined)?.blob || null);
      request.onerror = () => reject(request.error);
    });
  }

  async listMetadata() {
    await this.init();
    return new Promise<StoredImageMetadata[]>((resolve, reject) => {
      const request = this.db!.transaction(storeName).objectStore(storeName).getAll();
      request.onsuccess = () => {
        const images = (request.result as StoredImage[]).map(({ blob: _blob, ...metadata }) => metadata);
        resolve(images);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string) {
    await this.init();
    this.revokeObjectUrl(id);
    await new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      transaction.objectStore(storeName).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getObjectUrl(id: string) {
    const cached = this.objectUrls.get(id);
    if (cached) return cached;

    const blob = await this.getBlob(id);
    if (!blob) return null;

    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.set(id, objectUrl);
    return objectUrl;
  }

  revokeObjectUrl(id: string) {
    const objectUrl = this.objectUrls.get(id);
    if (!objectUrl) return;
    URL.revokeObjectURL(objectUrl);
    this.objectUrls.delete(id);
  }

  dispose() {
    for (const objectUrl of this.objectUrls.values()) {
      URL.revokeObjectURL(objectUrl);
    }
    this.objectUrls.clear();
    this.db?.close();
    this.db = null;
  }
}

export async function compressImage(file: File) {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  const dataUrl = await blobToDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('图片加载失败'));
    img.src = dataUrl;
  });

  const max = 1920;
  const scale = Math.min(1, max / image.width, max / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return file;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mimeType, 0.85));
  return blob && blob.size < file.size ? blob : file;
}

export function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
    reader.readAsDataURL(blob);
  });
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
