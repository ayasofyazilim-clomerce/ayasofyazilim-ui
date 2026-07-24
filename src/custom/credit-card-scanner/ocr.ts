import type { Worker } from "tesseract.js";

/**
 * OCR for the credit-card scanner, built on Tesseract.js.
 *
 * Like the MRZ scanner, Tesseract is loaded via dynamic import behind a single
 * shared worker so it stays out of the SSR path and the initial bundle, and the
 * language model is fetched only the first time a scan actually runs.
 *
 * The worker is restricted to the characters that appear in the card number and
 * the "valid thru" date - digits, space and the date separator. This sharply
 * improves digit accuracy versus the full alphabet. (Cardholder-name reading,
 * planned later, will need a second pass with letters whitelisted - keep that
 * separate so it doesn't degrade number recognition.)
 */

// Card number + expiry use only digits, spaces and the `/` date separator.
const CARD_CHARSET = "0123456789 /";

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker, PSM } = await import("tesseract.js");
      const worker = await createWorker("eng");
      await worker.setParameters({
        tessedit_char_whitelist: CARD_CHARSET,
        // Card text is a few short, scattered lines (number, date) rather than a
        // paragraph - sparse-text mode finds them without assuming a layout.
        tessedit_pageseg_mode: PSM.SPARSE_TEXT,
      });
      return worker;
    })();
    // If init fails (e.g. the language model fetch dies mid-download), don't
    // cache the rejection - that would leave OCR permanently dead for the
    // session. Clearing lets the next scan pass retry from scratch.
    workerPromise.catch(() => {
      workerPromise = null;
    });
  }
  return workerPromise;
}

/**
 * Run OCR over a (pre-processed) card crop and return the raw recognised text.
 *
 * On a recognition error the shared worker is torn down before rethrowing, so
 * the next pass builds a fresh one - a crashed/wedged worker must not poison
 * every subsequent scan for the rest of the session.
 */
export async function readCardText(source: HTMLCanvasElement): Promise<string> {
  const worker = await getWorker();
  try {
    const { data } = await worker.recognize(source);
    return data.text ?? "";
  } catch (err) {
    await terminateCardOcr();
    throw err;
  }
}

/** Tear down the shared worker (e.g. on app teardown). Safe to call if unused. */
export async function terminateCardOcr(): Promise<void> {
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
