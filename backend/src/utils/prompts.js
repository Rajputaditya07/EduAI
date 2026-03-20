/**
 * Build the grading prompt for Gemini.
 * @param {Object}      assignment    - Assignment document with title, description, rubric
 * @param {string|null} extractedText - Extracted text from file, or null for images
 * @returns {string}
 */
const buildGradingPrompt = (assignment, extractedText) => {
  const rubricJSON = JSON.stringify(
    assignment.rubric.map((r) => ({
      criterion: r.criterion,
      description: r.description || "",
      maxMarks: r.maxMarks,
    })),
    null,
    2
  );

  const studentContent = extractedText
    ? `\n--- STUDENT SUBMISSION TEXT ---\n${extractedText}\n--- END OF SUBMISSION ---`
    : "\n[Image submission — evaluate based on visual content provided alongside this prompt]";

  return `You are a strict, fair, and thorough academic grader. Grade the following student submission against the provided rubric precisely.

ASSIGNMENT TITLE: ${assignment.title}

ASSIGNMENT DESCRIPTION:
${assignment.description}

RUBRIC (JSON):
${rubricJSON}
${studentContent}

INSTRUCTIONS:
1. Evaluate the submission against EACH rubric criterion independently.
2. Score each criterion from 0 to its maxMarks (integers only).
3. Provide 1-2 sentences of specific, actionable feedback per criterion in the "aiFeedback" field.
4. Calculate totalScore as the sum of all criterion scores.
5. Calculate totalMaxMarks as the sum of all maxMarks.
6. Write a concise overall feedback paragraph (3-5 sentences) covering strengths and areas for improvement.
7. Set gradingConfidence to "high", "medium", or "low" based on how clearly the submission addresses the rubric.

Return ONLY a valid JSON object matching this exact schema — no additional text, no markdown, no explanation outside the JSON:
{
  "criteria": [
    {
      "criterion": "<criterion name>",
      "score": <integer>,
      "maxMarks": <integer>,
      "aiFeedback": "<1-2 sentence feedback>"
    }
  ],
  "totalScore": <integer>,
  "totalMaxMarks": <integer>,
  "overallFeedback": "<3-5 sentence summary>",
  "gradingConfidence": "<high|medium|low>"
}`;
};

export { buildGradingPrompt };
