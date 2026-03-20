import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import { ApiError } from "./ApiError.js";

const MAX_CHARS = 8000;

/**
 * Extract text from a file buffer based on its mimetype.
 * Returns null for images (they are passed as vision input to Gemini).
 */
const extractTextFromFile = async (buffer, mimetype) => {
  try {
    if (mimetype === "application/pdf") {
      const data = await pdf(buffer);
      return data.text.slice(0, MAX_CHARS);
    }

    if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_CHARS);
    }

    // Images → null (handled via Gemini vision)
    if (mimetype.startsWith("image/")) {
      return null;
    }

    throw new ApiError(422, `Unsupported file type for text extraction: ${mimetype}`);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(422, `Failed to extract text from file: ${err.message}`);
  }
};

export { extractTextFromFile };
