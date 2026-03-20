import "dotenv/config";
import mongoose from "mongoose";
import User from "../modules/users/user.model.js";
import Classroom from "../modules/classrooms/classroom.model.js";
import Assignment from "../modules/assignments/assignment.model.js";

const DRY_RUN = process.argv.includes("--dry-run");

const seedData = {
  admin: {
    name: "Admin User",
    email: "admin@eduai.com",
    password: "Password123",
    role: "admin",
  },
  teacher: {
    name: "Dr. Sarah Johnson",
    email: "teacher@eduai.com",
    password: "Password123",
    role: "teacher",
  },
  students: [
    { name: "Alice Smith", email: "alice@eduai.com", password: "Password123", role: "student" },
    { name: "Bob Williams", email: "bob@eduai.com", password: "Password123", role: "student" },
    { name: "Charlie Brown", email: "charlie@eduai.com", password: "Password123", role: "student" },
    { name: "Diana Ross", email: "diana@eduai.com", password: "Password123", role: "student" },
    { name: "Edward Chen", email: "edward@eduai.com", password: "Password123", role: "student" },
  ],
  classroom: {
    name: "Introduction to Computer Science",
    subject: "Computer Science",
  },
  assignments: [
    {
      title: "Introduction to Variables",
      description:
        "Write a short essay explaining what variables are in programming, including data types, naming conventions, and examples in at least one programming language.",
      rubric: [
        { criterion: "Understanding of Variables", description: "Demonstrates clear understanding of what variables are", maxMarks: 10 },
        { criterion: "Data Types Coverage", description: "Covers common data types (int, string, boolean, etc.)", maxMarks: 10 },
        { criterion: "Code Examples", description: "Provides correct code examples", maxMarks: 10 },
      ],
      daysUntilDue: 30,
    },
    {
      title: "Functions and Scope",
      description:
        "Explain the concept of functions in programming. Cover function declaration, parameters, return values, scope and closures with working examples.",
      rubric: [
        { criterion: "Function Concepts", description: "Clearly explains function declaration and usage", maxMarks: 10 },
        { criterion: "Scope Understanding", description: "Demonstrates understanding of scope and closures", maxMarks: 10 },
        { criterion: "Practical Examples", description: "Provides working code examples that compile/run", maxMarks: 10 },
      ],
      daysUntilDue: 45,
    },
  ],
};

const seed = async () => {
  if (DRY_RUN) {
    console.log("\n🔍 DRY RUN — nothing will be written to the database.\n");
    console.log("Would create:");
    console.log(`  • 1 Admin:   ${seedData.admin.email}`);
    console.log(`  • 1 Teacher: ${seedData.teacher.email}`);
    console.log(`  • ${seedData.students.length} Students: ${seedData.students.map((s) => s.email).join(", ")}`);
    console.log(`  • 1 Classroom: ${seedData.classroom.name}`);
    console.log(`  • ${seedData.assignments.length} Assignments: ${seedData.assignments.map((a) => a.title).join(", ")}`);
    console.log("\nAll passwords: Password123");
    process.exit(0);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅  Connected to MongoDB\n");

    // Drop collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      await mongoose.connection.db.dropCollection(col.name);
    }
    console.log("🗑️  Dropped all existing collections\n");

    // Create users
    const admin = await User.create(seedData.admin);
    const teacher = await User.create(seedData.teacher);
    const students = await User.insertMany(
      seedData.students.map((s) => ({ ...s }))
    );

    console.log(`👤 Admin:   ${admin.email}  (ID: ${admin._id})`);
    console.log(`👨‍🏫 Teacher: ${teacher.email} (ID: ${teacher._id})`);
    students.forEach((s) =>
      console.log(`🎓 Student: ${s.email}  (ID: ${s._id})`)
    );

    // Create classroom
    const classroom = await Classroom.create({
      ...seedData.classroom,
      teacher: teacher._id,
      students: students.map((s) => s._id),
    });

    // Update teacher + students classrooms arrays
    await User.findByIdAndUpdate(teacher._id, {
      $push: { classrooms: classroom._id },
    });
    await User.updateMany(
      { _id: { $in: students.map((s) => s._id) } },
      { $push: { classrooms: classroom._id } }
    );

    console.log(
      `\n🏫 Classroom: ${classroom.name} (ID: ${classroom._id}, Join Code: ${classroom.joinCode})`
    );

    // Create assignments
    for (const asgnData of seedData.assignments) {
      const { daysUntilDue, ...rest } = asgnData;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + daysUntilDue);

      const assignment = await Assignment.create({
        ...rest,
        classroom: classroom._id,
        teacher: teacher._id,
        dueDate,
        status: "published",
      });
      console.log(
        `📝 Assignment: ${assignment.title} (ID: ${assignment._id}, Total: ${assignment.totalMarks} marks)`
      );
    }

    console.log("\n──────────────────────────────────────────");
    console.log("✅  Seeding complete!");
    console.log(`🔑 All passwords: Password123`);
    console.log(`🔗 Join Code: ${classroom.joinCode}`);
    console.log("──────────────────────────────────────────\n");
  } catch (err) {
    console.error("❌  Seeding failed:", err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
