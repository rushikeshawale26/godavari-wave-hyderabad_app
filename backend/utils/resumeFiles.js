const fs = require("node:fs/promises");
const path = require("node:path");

const RESUME_UPLOAD_DIR = path.resolve(
  process.env.RESUME_UPLOAD_DIR || path.join(__dirname, "..", "uploads", "resumes")
);

const resolveResumePath = (storedPath) => {
  if (
    typeof storedPath !== "string" ||
    !storedPath ||
    path.basename(storedPath) !== storedPath
  ) {
    throw new Error("Stored resume path is invalid");
  }

  const resolvedPath = path.resolve(RESUME_UPLOAD_DIR, storedPath);
  if (!resolvedPath.startsWith(`${RESUME_UPLOAD_DIR}${path.sep}`)) {
    throw new Error("Stored resume path is outside the upload directory");
  }
  return resolvedPath;
};

const saveResumeFile = async (storedPath, buffer) => {
  const fullPath = resolveResumePath(storedPath);
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true });
  try {
    await fs.writeFile(fullPath, buffer, { flag: "wx" });
  } catch (error) {
    try {
      await fs.unlink(fullPath);
    } catch (cleanupError) {
      if (cleanupError.code !== "ENOENT") {
        error.resumeCleanupError = cleanupError;
        console.error("Failed to clean up an incomplete resume upload:", cleanupError);
      }
    }
    throw error;
  }
  return fullPath;
};

const removeResumeFile = async (storedPath) => {
  if (!storedPath) return null;

  const fullPath = resolveResumePath(storedPath);
  try {
    const contents = await fs.readFile(fullPath);
    await fs.unlink(fullPath);
    return { fullPath, contents };
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
};

const restoreResumeFile = async (removedFile) => {
  if (!removedFile) return;
  await fs.mkdir(RESUME_UPLOAD_DIR, { recursive: true });
  await fs.writeFile(removedFile.fullPath, removedFile.contents, { flag: "wx" });
};

const deleteApplicationWithResume = async (Application, id) => {
  const application = await Application.findById(id)
    .select("+resumeStoredPath")
    .lean();
  if (!application) return null;

  const removedFile = await removeResumeFile(application.resumeStoredPath);
  try {
    const deleted = await Application.findByIdAndDelete(id)
      .select("+resumeStoredPath")
      .lean();
    if (!deleted) {
      await restoreResumeFile(removedFile);
    }
    return deleted;
  } catch (error) {
    try {
      await restoreResumeFile(removedFile);
    } catch (restoreError) {
      error.resumeRestoreError = restoreError;
      console.error("Failed to restore resume after application deletion failed:", restoreError);
    }
    throw error;
  }
};

module.exports = {
  RESUME_UPLOAD_DIR,
  deleteApplicationWithResume,
  removeResumeFile,
  resolveResumePath,
  saveResumeFile,
};
