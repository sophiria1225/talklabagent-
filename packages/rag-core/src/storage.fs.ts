import { promises as fs } from "node:fs";
import { join } from "node:path";

const INDEX_FILE = "rag-index.json";

type IndexEntry = { id: string; embedding: number[] };

export async function writeIndex(rootDir: string, entries: IndexEntry[]): Promise<void> {
  const file = join(rootDir, INDEX_FILE);
  await fs.writeFile(file, JSON.stringify({ entries }, null, 2), "utf8");
}

export async function readIndex(rootDir: string): Promise<IndexEntry[] | undefined> {
  try {
    const file = join(rootDir, INDEX_FILE);
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as { entries?: IndexEntry[] };
    return parsed.entries ?? [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

// TODO: SQLite や pg による永続ストレージを実装する。
