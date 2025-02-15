import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);
let isConnected = false; // Track if already connected

export async function POST(req: NextRequest) {
  try {
    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const database = client.db("documents");
    const collection = database.collection("data");

    const documents = await collection.find({}).toArray();

    return NextResponse.json({ documents }, { status: 200 }); // Wrapped in an object
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ message: "Failed to fetch documents" }, { status: 500 });
  }
}
