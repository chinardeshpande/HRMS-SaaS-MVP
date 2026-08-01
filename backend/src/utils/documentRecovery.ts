import fs from "fs";
import path from "path";

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
