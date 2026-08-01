import fs from "fs";
import path from "path";
import { createHash } from "crypto";

export interface RecoveryIndex {
  byBasename: Map<string, string[]>;
  indexedFiles: number;
  skippedDirectories: number;
}

export const buildRecoveryIndex = (searchRoots: string[]): RecoveryIndex => {
  const byBasename = new Map<string, string[]>();
  let indexedFiles = 0;
  let skippedDirectories = 0;

  const visit = (directory: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      skippedDirectories += 1;
      return;
    }

    for (const entry of entries) {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        visit(candidate);
      } else if (entry.isFile()) {
        const key = entry.name.toLocaleLowerCase();
        byBasename.set(key, [...(byBasename.get(key) || []), candidate]);
        indexedFiles += 1;
      }
    }
  };

  searchRoots.forEach(visit);
  return { byBasename, indexedFiles, skippedDirectories };
};

export const findRecoveryCandidates = (
  index: RecoveryIndex,
  storedNames: Array<string | null | undefined>,
): string[] => {
  const basenames = Array.from(
    new Set(
      storedNames
        .filter((value): value is string => Boolean(value))
        .map((value) =>
          path.basename(value.replace(/^file:\/\//, "")).toLocaleLowerCase(),
        )
        .filter(Boolean),
    ),
  );

  return Array.from(
    new Set(
      basenames.flatMap((basename) => index.byBasename.get(basename) || []),
    ),
  );
};

const sha256File = (filePath: string): string => {
  const hash = createHash("sha256");
  const descriptor = fs.openSync(filePath, "r");
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead = 0;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead);
  } finally {
    fs.closeSync(descriptor);
  }
  return hash.digest("hex");
};

export type RecoveryCandidateClassification =
  | { status: "none"; selectedPath: null }
  | { status: "identical"; selectedPath: string }
  | { status: "conflicting"; selectedPath: null };

export const classifyRecoveryCandidates = (
  candidatePaths: string[],
): RecoveryCandidateClassification => {
  if (!candidatePaths.length) return { status: "none", selectedPath: null };
  const hashes = new Set(candidatePaths.map(sha256File));
  if (hashes.size > 1) return { status: "conflicting", selectedPath: null };
  return { status: "identical", selectedPath: [...candidatePaths].sort()[0] };
};
