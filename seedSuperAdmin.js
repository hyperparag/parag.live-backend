const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const DB_URL =
  "mongodb+srv://parag0045_db_user:DHitZqC50v1XPGpl@cluster0.tvtilag.mongodb.net/skipthegames?appName=Cluster0";

async function seed() {
  try {
    await mongoose.connect(DB_URL);
    console.log("Connected to database");

    const User = mongoose.model(
      "User",
      new mongoose.Schema(
        {
          firstName: String,
          lastName: String,
          email: { type: String, lowercase: true, trim: true },
          phone: String,
          password: String,
          avater: { type: String, default: "avater" },
          role: { type: String, default: "user" },
          isDelete: { type: Boolean, default: false },
          credit: { type: Number, default: 0 },
        },
        { timestamps: true },
      ),
    );

    const email = "superadmin@parag.com";
    const existing = await User.findOne({ email });

    if (existing) {
      // Update role to superAdmin if user exists
      existing.role = "superAdmin";
      await existing.save();
      console.log("User already exists — updated role to superAdmin");
      console.log("Email:", email);
    } else {
      const hashedPassword = await bcrypt.hash("Super@1234", 10);
      await User.create({
        firstName: "Super",
        lastName: "Admin",
        email,
        password: hashedPassword,
        role: "superAdmin",
        credit: 9999,
      });
      console.log("SuperAdmin created successfully!");
      console.log("Email:", email);
      console.log("Password: Super@1234");
    }

    await mongoose.disconnect();
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

seed();
