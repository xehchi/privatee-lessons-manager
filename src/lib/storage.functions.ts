import { createServerFn } from "@tanstack/react-start";
import type { AppData } from "@/lib/types";

export const loadFromDisk = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { readDisk } = await import("@/server/storage.server");
    const data = await readDisk();
    return { ok: true as const, data };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
});

export const saveToDisk = createServerFn({ method: "POST" })
  .inputValidator((input: AppData) => input)
  .handler(async ({ data }) => {
    try {
      const { writeDisk } = await import("@/server/storage.server");
      await writeDisk(data);
      return { ok: true as const };
    } catch (e) {
      return { ok: false as const, error: (e as Error).message };
    }
  });
