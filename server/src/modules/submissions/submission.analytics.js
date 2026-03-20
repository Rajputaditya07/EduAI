import mongoose from "mongoose";
import Submission from "./submission.model.js";
import Assignment from "../assignments/assignment.model.js";
import Classroom from "../classrooms/classroom.model.js";
import { ApiError } from "../../utils/ApiError.js";

// ── 1. Classroom Analytics (teacher) ────────────────────────────
const getClassroomAnalytics = async (classroomId, teacherId) => {
  const classroom = await Classroom.findById(classroomId);
  if (!classroom) throw new ApiError(404, "Classroom not found");
  if (classroom.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const classroomObjId = new mongoose.Types.ObjectId(classroomId);
  const studentCount = classroom.students.length;

  // Assignment count + breakdown
  const assignments = await Assignment.find({ classroom: classroomId }).lean();
  const totalAssignments = assignments.length;

  if (totalAssignments === 0) {
    return {
      totalAssignments: 0,
      totalSubmissions: 0,
      submissionRate: 0,
      classAverage: 0,
      assignmentBreakdown: [],
    };
  }

  const assignmentIds = assignments.map((a) => a._id);

  // Aggregation for submissions breakdown per assignment
  const breakdown = await Submission.aggregate([
    { $match: { assignment: { $in: assignmentIds }, status: "graded" } },
    {
      $group: {
        _id: "$assignment",
        submissionCount: { $sum: 1 },
        averageScore: {
          $avg: {
            $cond: [
              { $gt: ["$result.totalMaxMarks", 0] },
              {
                $multiply: [
                  { $divide: ["$result.totalScore", "$result.totalMaxMarks"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  const totalSubmissions = await Submission.countDocuments({
    assignment: { $in: assignmentIds },
  });

  const totalPossible = totalAssignments * (studentCount || 1);
  const submissionRate = Math.round((totalSubmissions / totalPossible) * 100);

  // Class average across all graded
  const avgResult = await Submission.aggregate([
    { $match: { assignment: { $in: assignmentIds }, status: "graded" } },
    {
      $group: {
        _id: null,
        classAverage: {
          $avg: {
            $cond: [
              { $gt: ["$result.totalMaxMarks", 0] },
              {
                $multiply: [
                  { $divide: ["$result.totalScore", "$result.totalMaxMarks"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  const assignmentBreakdown = assignments.map((a) => {
    const stats = breakdown.find(
      (b) => b._id.toString() === a._id.toString()
    ) || { submissionCount: 0, averageScore: 0 };

    return {
      assignmentId: a._id,
      title: a.title,
      submissionCount: stats.submissionCount,
      averageScore: Math.round(stats.averageScore * 100) / 100,
      submissionRate: studentCount
        ? Math.round((stats.submissionCount / studentCount) * 100)
        : 0,
    };
  });

  return {
    totalAssignments,
    totalSubmissions,
    submissionRate,
    classAverage:
      avgResult.length > 0
        ? Math.round(avgResult[0].classAverage * 100) / 100
        : 0,
    assignmentBreakdown,
  };
};

// ── 2. Assignment Analytics (teacher) ───────────────────────────
const getAssignmentAnalytics = async (assignmentId, teacherId) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) throw new ApiError(404, "Assignment not found");
  if (assignment.teacher.toString() !== teacherId.toString()) {
    throw new ApiError(403, "Access denied");
  }

  const assignmentObjId = new mongoose.Types.ObjectId(assignmentId);

  // Counts by status
  const [submissionCount, gradedCount, pendingCount, errorCount] =
    await Promise.all([
      Submission.countDocuments({ assignment: assignmentObjId }),
      Submission.countDocuments({ assignment: assignmentObjId, status: "graded" }),
      Submission.countDocuments({ assignment: assignmentObjId, status: "pending" }),
      Submission.countDocuments({ assignment: assignmentObjId, status: "error" }),
    ]);

  // Criterion averages
  const criterionAverages = await Submission.aggregate([
    { $match: { assignment: assignmentObjId, status: "graded" } },
    { $unwind: "$result.criteria" },
    {
      $group: {
        _id: "$result.criteria.criterion",
        averageScore: { $avg: "$result.criteria.score" },
        maxMarks: { $first: "$result.criteria.maxMarks" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Score distribution
  const distribution = await Submission.aggregate([
    { $match: { assignment: assignmentObjId, status: "graded" } },
    {
      $addFields: {
        percentage: {
          $cond: [
            { $gt: ["$result.totalMaxMarks", 0] },
            {
              $multiply: [
                { $divide: ["$result.totalScore", "$result.totalMaxMarks"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $bucket: {
        groupBy: "$percentage",
        boundaries: [0, 41, 61, 81, 101],
        default: "other",
        output: { count: { $sum: 1 } },
      },
    },
  ]);

  // Map bucket results to named ranges
  const rangeNames = { 0: "0-40%", 41: "41-60%", 61: "61-80%", 81: "81-100%" };
  const scoreDistribution = {};
  for (const key of [0, 41, 61, 81]) {
    const bucket = distribution.find((d) => d._id === key);
    scoreDistribution[rangeNames[key]] = bucket ? bucket.count : 0;
  }

  return {
    criterionAverages: criterionAverages.map((c) => ({
      criterion: c._id,
      averageScore: Math.round(c.averageScore * 100) / 100,
      maxMarks: c.maxMarks,
    })),
    scoreDistribution,
    submissionCount,
    gradedCount,
    pendingCount,
    errorCount,
  };
};

// ── 3. Student Progress ─────────────────────────────────────────
const getStudentProgress = async (studentId) => {
  const studentObjId = new mongoose.Types.ObjectId(studentId);

  // Score history
  const submissions = await Submission.find({
    student: studentObjId,
    status: "graded",
  })
    .populate("assignment", "title")
    .sort({ submittedAt: 1 })
    .lean();

  const scoreHistory = submissions.map((s) => ({
    assignmentTitle: s.assignment?.title || "Unknown",
    submittedAt: s.submittedAt,
    score: s.result?.totalScore || 0,
    maxMarks: s.result?.totalMaxMarks || 0,
    percentage:
      s.result?.totalMaxMarks > 0
        ? Math.round(
            (s.result.totalScore / s.result.totalMaxMarks) * 100 * 100
          ) / 100
        : 0,
  }));

  // Criterion strengths (aggregated)
  const criterionStrengths = await Submission.aggregate([
    { $match: { student: studentObjId, status: "graded" } },
    { $unwind: "$result.criteria" },
    {
      $group: {
        _id: "$result.criteria.criterion",
        averageScore: { $avg: "$result.criteria.score" },
        maxMarks: { $avg: "$result.criteria.maxMarks" },
      },
    },
    { $sort: { averageScore: -1 } },
  ]);

  // Overall average
  const overallResult = await Submission.aggregate([
    { $match: { student: studentObjId, status: "graded" } },
    {
      $group: {
        _id: null,
        overallAverage: {
          $avg: {
            $cond: [
              { $gt: ["$result.totalMaxMarks", 0] },
              {
                $multiply: [
                  { $divide: ["$result.totalScore", "$result.totalMaxMarks"] },
                  100,
                ],
              },
              0,
            ],
          },
        },
      },
    },
  ]);

  return {
    scoreHistory,
    criterionStrengths: criterionStrengths.map((c) => ({
      criterion: c._id,
      averageScore: Math.round(c.averageScore * 100) / 100,
      maxMarks: Math.round(c.maxMarks * 100) / 100,
    })),
    overallAverage:
      overallResult.length > 0
        ? Math.round(overallResult[0].overallAverage * 100) / 100
        : 0,
  };
};

export { getClassroomAnalytics, getAssignmentAnalytics, getStudentProgress };
