import mongoose from "mongoose";

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: { type: String, required: true },
    description: { type: String, default: "" },
    maxMarks: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Classroom",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    rubric: {
      type: [rubricItemSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: "At least one rubric criterion is required",
      },
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    allowedFileTypes: {
      type: [String],
      default: ["pdf", "docx"],
    },
    status: {
      type: String,
      enum: ["draft", "published", "closed"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Compute totalMarks from rubric before saving
assignmentSchema.pre("save", function (next) {
  if (this.isModified("rubric")) {
    this.totalMarks = this.rubric.reduce((sum, item) => sum + item.maxMarks, 0);
  }
  next();
});

export default mongoose.model("Assignment", assignmentSchema);
