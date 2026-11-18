/**
 * Fetches every URL in parallel and reports combined progress (0 → 1).
 * Progress is bytes against Content-Length when every file sends one,
 * otherwise the share of finished files. It never goes backwards.
 * Returns one promise per file, resolving to its Blob.
 */
export function loadImages(
  urls: string[],
  onProgress: (progress: number) => void,
  signal: AbortSignal,
): Promise<Blob>[] {
  const n = urls.length;
  const totals: (number | null | undefined)[] = urls.map(() => undefined); // undefined: no headers yet
  const bytes = urls.map(() => 0);
  const done = urls.map(() => false);
  let last = 0;

  const report = () => {
    const allKnown = totals.every((t) => typeof t === "number" && t > 0);
    let p: number;
    if (allKnown) {
      const sumTotal = totals.reduce<number>((a, t) => a + (t as number), 0);
      const sumBytes = bytes.reduce((a, b) => a + b, 0);
      p = sumBytes / sumTotal;
    } else {
      p = done.filter(Boolean).length / n;
    }
    p = Math.min(1, Math.max(last, p));
    last = p;
    onProgress(p);
  };

  return urls.map(async (url, i) => {
    const res = await fetch(url, { signal, mode: "cors" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    const len = Number(res.headers.get("Content-Length"));
    totals[i] = Number.isFinite(len) && len > 0 ? len : null;
    const type = res.headers.get("Content-Type") ?? "";

    let blob: Blob;
    if (res.body) {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        chunks.push(value);
        bytes[i] += value.byteLength;
        report();
      }
      blob = new Blob(chunks as BlobPart[], { type });
    } else {
      blob = await res.blob();
      bytes[i] = blob.size;
    }
    done[i] = true;
    report();
    return blob;
  });
}
