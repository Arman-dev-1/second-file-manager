import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const client = new MongoClient(uri);

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || null;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await client.connect();
    const database = client.db("documents");
    const collection = database.collection("data");

    const document = await collection.findOne({ _id: new ObjectId(token) });
    if (!document) {
      return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({ content: document.content , type: document.type , name : document.name , sheetNames : document.sheetNames , data:document});
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
