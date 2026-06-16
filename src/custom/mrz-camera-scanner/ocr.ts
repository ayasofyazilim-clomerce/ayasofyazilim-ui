import type { Worker } from "tesseract.js";

/**
 * Minimal OCR confirmation for the MRZ band. We don't parse the MRZ — we only
 * read the candidate band and check that it contains the `<` filler character
 * that every MRZ uses heavily, as a final guard against false positives (a
 * dense block of ordinary text that happened to pass the morphology detector).
 *
 * Tesseract is loaded via dynamic import and a single shared worker so it stays
 * out of the SSR path and the initial bundle, and the model is fetched only the
 * first time verification actually runs.
 */

// MRZ uses only A–Z, 0–9 and the `<` filler.
const MRZ_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: MRZ_CHARSET,
        // The band is a single uniform block of text.
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      return worker;
    })();
  }
  return workerPromise;
}

/** Run OCR over a cropped canvas and return the raw recognised text. */
export async function readBandText(source: HTMLCanvasElement): Promise<string> {
  const worker = await getWorker();
  const { data } = await worker.recognize(source);
  return data.text ?? "";
}

/** Count the `<` filler characters in recognised text. */
export function countFillerChars(text: string): number {
  return (text.match(/</g) ?? []).length;
}

/** Tear down the shared worker (e.g. on app teardown). Safe to call if unused. */
export async function terminateMrzOcr(): Promise<void> {
  if (!workerPromise) return;
  try {
    const worker = await workerPromise;
    await worker.terminate();
  } catch {
    /* ignore */
  } finally {
    workerPromise = null;
  }
}
