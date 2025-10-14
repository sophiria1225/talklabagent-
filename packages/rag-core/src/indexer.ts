import { promises as fs } from "node:fs";
import { join } from "node:path";
import { embedText } from "./embed.js";
import { writeIndex } from "./storage.fs.js";

/**
 * PDF ディレクトリを走査し、簡易インデックスを生成するスタブ。
 * TODO: PDF パーサーを導入し、ページ単位で正確にテキスト抽出する。
 */
export async function indexPdfDir(rootDir: string) {
  const files = await fs.readdir(rootDir);
  const entries = [] as Array<{ id: string; embedding: number[] }>;

  for (const file of files) {
    if (!file.toLowerCase().endsWith(".pdf")) continue;
    const fakeContent = `PDF(${file})`;
    const embedding = await embedText(fakeContent);
    entries.push({ id: join(rootDir, file), embedding });
  }

  await writeIndex(rootDir, entries);
}
