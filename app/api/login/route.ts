import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import { cookies } from "next/headers";

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json() || {};

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
    }

    await client.connect();
    const db = client.db("documents");
    const usersCollection = db.collection("users");

    // Check if the user exists
    const user = await usersCollection.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Compare the entered password with the hashed password in DB
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }

    // Generate a simple session token (random string)
    const sessionToken = Math.random().toString(36).substr(2);

    // Store the session in the database
    await db.collection("sessions").insertOne({
      email,
      sessionToken,
      createdAt: new Date(),
    });

    // Set the session token as a cookie
    const cookieStore = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    };

    return NextResponse.json({ message: "Login successful", cookieStore }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
