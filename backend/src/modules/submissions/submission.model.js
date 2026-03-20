import mongoose from "mongoose";

const criterionResultSchema = new mongoose.Schema(
  {
    criterion: { type: String },
    score: { type: Number },
    maxMarks: { type: Number },
    aiFeedback: { type: String },
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    filePublicId: {
      type: String,
      required: [true, "File public ID is required"],
    },
    fileType: {
      type: String,
      required: true,
      enum: ["pdf", "docx", "image"],
    },
    status: {
      type: String,
      enum: ["pending", "grading", "graded", "error"],
      default: "pending",
    },
    result: {
      criteria: [criterionResultSchema],
      totalScore: { type: Number },
      totalMaxMarks: { type: Number },
      overallFeedback: { type: String },
      gradingConfidence: { type: String },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    gradedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// One submission per student per assignment
submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);
