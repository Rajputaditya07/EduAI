import mongoose from "mongoose";
import crypto from "crypto";

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Classroom name is required"],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    joinCode: {
      type: String,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Generate a unique 6-char alphanumeric join code before saving
classroomSchema.pre("save", function (next) {
  if (!this.joinCode) {
    this.joinCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 hex chars
  }
  next();
});

export default mongoose.model("Classroom", classroomSchema);
