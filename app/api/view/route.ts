import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI is not defined in environment variables.");
}

const client = new MongoClient(uri);
let isConnected = false;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ message: "Document ID is required" }, { status: 400 });
    }

    if (!isConnected) {
      await client.connect();
      isConnected = true;
    }

    const database = client.db("documents");
    const collection = database.collection("data");

    const document = await collection.findOne({ _id: new ObjectId(documentId) });

    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ document }, { status: 200 });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ message: "Failed to fetch document" }, { status: 500 });
  }
}
