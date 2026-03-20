import Submission from "../submissions/submission.model.js";
import { geminiModel } from "../../config/gemini.js";
import { extractTextFromFile } from "../../utils/extractText.js";
import { buildGradingPrompt } from "../../utils/prompts.js";
import { createAndSend } from "../notifications/notification.controller.js";

// ── Simple rate limiter (Gemini free tier = 15 RPM) ─────────────
let lastCallTimestamp = 0;
const MIN_INTERVAL_MS = 4000;

const waitForRateLimit = async () => {
  const elapsed = Date.now() - lastCallTimestamp;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed)
    );
  }
  lastCallTimestamp = Date.now();
};

/**
 * Download a file from a URL into a Buffer.
 */
const downloadFile = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download file: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Map our fileType enum to a mimetype for extraction / Gemini.
 */
const fileTypeToMime = (fileType) => {
  const map = {
    pdf: "application/pdf",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    image: "image/png",
  };
  return map[fileType] || "application/octet-stream";
};

/**
 * Grade a submission using Gemini 1.5 Flash.
 * This function is designed to be called fire-and-forget;
 * it NEVER throws an unhandled error that could crash the server.
 */
const gradeSubmission = async (submissionId) => {
  let submission;
  try {
    // 1. Fetch submission + assignment
    submission = await Submission.findById(submissionId).populate({
      path: "assignment",
      select: "title description rubric totalMarks",
    });

    if (!submission) {
      console.error(`[Grading] Submission ${submissionId} not found`);
      return;
    }

    // 2. Set status to grading
    submission.status = "grading";
    await submission.save();

    // 3. Download file
    const buffer = await downloadFile(submission.fileUrl);
    const mimetype = fileTypeToMime(submission.fileType);

    // 4. Extract text (null for images)
    const extractedText = await extractTextFromFile(buffer, mimetype);

    // 5. Build prompt
    const prompt = buildGradingPrompt(submission.assignment, extractedText);

    // 6. Rate limit
    await waitForRateLimit();

    // 7. Call Gemini
    let result;
    if (submission.fileType === "image") {
      // Multimodal: pass image as inline data
      const base64Data = buffer.toString("base64");
      const imagePart = {
        inlineData: { data: base64Data, mimeType: mimetype },
      };
      result = await geminiModel.generateContent([prompt, imagePart]);
    } else {
      result = await geminiModel.generateContent(prompt);
    }

    // 8. Parse response
    const responseText = result.response.text();
    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${responseText.slice(0, 200)}`);
    }

    // 9. Validate shape
    if (!parsed.criteria || !Array.isArray(parsed.criteria) || !parsed.overallFeedback) {
      throw new Error("Gemini response missing required fields");
    }

    // 10. Update submission
    submission.result = {
      criteria: parsed.criteria,
      totalScore: parsed.totalScore,
      totalMaxMarks: parsed.totalMaxMarks,
      overallFeedback: parsed.overallFeedback,
      gradingConfidence: parsed.gradingConfidence || "medium",
    };
    submission.status = "graded";
    submission.gradedAt = new Date();
    await submission.save();

    // 11. Notify student
    await createAndSend(
      submission.student,
      "grading_complete",
      "Your submission has been graded",
      `/submissions/${submissionId}`
    );

    console.log(`[Grading] ✅ Submission ${submissionId} graded successfully`);
  } catch (err) {
    console.error(`[Grading] ❌ Failed for submission ${submissionId}:`, err.message);

    // Set error status
    if (submission) {
      try {
        submission.status = "error";
        await submission.save();

        await createAndSend(
          submission.student,
          "grading_complete",
          "Grading failed. Please contact your teacher.",
          `/submissions/${submissionId}`
        );
      } catch (saveErr) {
        console.error(`[Grading] Failed to save error status:`, saveErr.message);
      }
    }
  }
};

export { gradeSubmission };
