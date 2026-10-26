type OcrProgress = (progress: number, status: string) => void;

let workerPromise: Promise<unknown> | null = null;
let idleTimer: number | null = null;

async function getWorker(onProgress?: OcrProgress) {
  if (!workerPromise) {
    workerPromise = (async () => {
      const module = (await import('tesseract.js')) as unknown as {
        createWorker: (
          lang: string,
          oem?: number,
          options?: { logger?: (message: { status: string; progress: number }) => void }
        ) => Promise<unknown>;
      };

      return module.createWorker('eng', 1, {
        logger: (message) => {
          if (typeof message.progress === 'number') {
            onProgress?.(message.progress, message.status);
          }
        },
      });
    })();
  }

  return workerPromise;
}

/**
 * Read text from a medical document image. The worker is lazy loaded only when
 * a patient scans or uploads an image, so the main bundle stays small.
 */
export async function extractTextFromImage(
  image: string | Blob,
  onProgress?: OcrProgress
): Promise<string> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new Error('Text recognition needs a connection the first time it runs.');
  }

  const worker = (await getWorker(onProgress)) as {
    recognize: (input: string | Blob) => Promise<{ data: { text: string } }>;
  };

  const result = await worker.recognize(image);
  const text = String(result?.data?.text || '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (idleTimer) window.clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    const current = worker as unknown as { terminate?: () => Promise<unknown> };
    void current.terminate?.();
    workerPromise = null;
  }, 120_000);

  return text;
}

export function resetOcrWorker() {
  if (idleTimer) window.clearTimeout(idleTimer);
  const current = workerPromise as Promise<{ terminate?: () => Promise<unknown> }> | null;
  void current?.then((worker) => worker.terminate?.()).catch(() => undefined);
  workerPromise = null;
}
