import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  buildRecoveryIndex,
  classifyRecoveryCandidates,
  findRecoveryCandidates,
} from "../../src/utils/documentRecovery";

describe("document recovery matching", () => {
  let rootDir: string;

  beforeEach(async () => {
    rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "aurahrms-recovery-"));
    await fs.mkdir(path.join(rootDir, "nested"));
    await fs.writeFile(
      path.join(rootDir, "nested", "Example.PDF"),
      "synthetic",
    );
  });

  afterEach(async () => {
    await fs.rm(rootDir, { recursive: true, force: true });
  });

  it("matches exact basenames case-insensitively across nested folders", () => {
    const index = buildRecoveryIndex([rootDir]);

    expect(
      findRecoveryCandidates(index, [
        "/uploads/employee-documents/example.pdf",
      ]),
    ).toEqual([path.join(rootDir, "nested", "Example.PDF")]);
    expect(index.indexedFiles).toBe(1);
  });

  it("does not use partial filename matches", () => {
    const index = buildRecoveryIndex([rootDir]);
    expect(findRecoveryCandidates(index, ["example-final.pdf"])).toEqual([]);
  });

  it("selects one candidate when duplicate files have identical content", async () => {
    const duplicate = path.join(rootDir, "duplicate.pdf");
    await fs.writeFile(duplicate, "synthetic");
    expect(
      classifyRecoveryCandidates([
        path.join(rootDir, "nested", "Example.PDF"),
        duplicate,
      ]).status,
    ).toBe("identical");
  });

  it("refuses candidates whose contents conflict", async () => {
    const conflict = path.join(rootDir, "conflict.pdf");
    await fs.writeFile(conflict, "different");
    expect(
      classifyRecoveryCandidates([
        path.join(rootDir, "nested", "Example.PDF"),
        conflict,
      ]),
    ).toEqual({ status: "conflicting", selectedPath: null });
  });
});
