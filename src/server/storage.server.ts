// Node.js disk storage. Used by server functions only.
// On platforms without a writable filesystem (e.g. Cloudflare Workers),
// the fs calls throw and the server function returns { ok: false }.
import type { AppData } from "@/lib/types";

const DATA_DIR = "data";
const DATA_FILE = "data/schedule.json";

async function ensureFs() {
  const fs = await import("node:fs/promises");
  return fs;
}

export async function readDisk(): Promise<AppData | null> {
  try {
    const fs = await ensureFs();
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as AppData;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err?.code === "ENOENT") return null;
    throw e;
  }
}

export async function writeDisk(data: AppData): Promise<void> {
  const fs = await ensureFs();
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    /* ignore */
  }
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
}
