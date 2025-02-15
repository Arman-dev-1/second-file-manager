"use client";
import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [error, setError] = useState<string>("");
  const [userToken, setUserToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Fetch the authentication token from localStorage or API
    const storedToken = localStorage.getItem("authToken");
    if (!storedToken) {
      router.push("/login");
      return;
    }
    setUserToken(storedToken);
    fetchDocuments(storedToken);
  }, []);

  const fetchDocuments = async (token: string) => {
    try {
      const response = await fetch(`/api/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const { documents } = await response.json();
      setPreviewData(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const onDrop = async (acceptedFiles: File[]) => {
    setError("");
    const previews = await Promise.all(acceptedFiles.map(processFile));
    const validPreviews = previews.filter((file) => file !== null);

    if (validPreviews.length === 0) {
      setError("Invalid or empty file. Please upload a valid .docx or .xlsx file.");
      return;
    }

    setFiles((prev) => [...prev, ...acceptedFiles]);
    setPreviewData((prev) => [...prev, ...validPreviews]);
  };

  const processFile = async (file: File) => {
    return new Promise(async (resolve) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        if (!event.target?.result) return resolve(null);

        if (file.name.endsWith(".xlsx")) {
          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });

          if (workbook.SheetNames.length === 0) return resolve(null);

          const sheets: any = {};
          workbook.SheetNames.forEach((sheetName) => {
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
            sheets[sheetName] = sheetData.length > 0 ? sheetData : [[""]];
          });

          resolve({ name: file.name, size: file.size, type: "xlsx", content: sheets, sheetNames: workbook.SheetNames });
        } else if (file.name.endsWith(".docx")) {
          const arrayBuffer = event.target.result as ArrayBuffer;
          const result = await mammoth.extractRawText({ arrayBuffer });

          if (!result.value.trim()) return resolve(null);

          resolve({ name: file.name, size: file.size, type: "docx", content: result.value });
        }
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const saveToDB = async (file: any) => {
    console.log("Saving File:", file);
    try {
      const response = await fetch("/api/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...file, token: userToken }),
      });

      const data = await response.json();
      console.log("Response from API:", data);
      fetchDocuments(userToken!);
    } catch (error) {
      console.error("Error saving file:", error);
    }
  };

  const generateShareableLink = (file: any) => {
    console.log("Generating shareable link for file:", file._id);
    return `${window.location.origin}/view/${file._id}`;
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
  });

  return (
    <div className="p-4 flex flex-col h-screen justify-between">
      <div>
      <div {...getRootProps()} className="border-2 border-dashed p-6 cursor-pointer text-center">
        <input {...getInputProps()} />
        <p>Drag & drop a .docx or .xlsx file here, or click to upload</p>
      </div>
      {error && <p className="text-red-500 mt-2">{error}</p>}

      <table className="mt-4 w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-gray-300 p-2">File Name</th>
            <th className="border border-gray-300 p-2">Size</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {previewData.map((file, index) => (
            <tr key={index} className="text-center">
              <td className="border border-gray-300 p-2">{file.name}</td>
              <td className="border border-gray-300 p-2">{(file.size / 1024).toFixed(2)} KB</td>
              <td className="border border-gray-300 p-2">
                <button
                  onClick={() => saveToDB(file)}
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                >
                  Save
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(generateShareableLink(file))}
                  className="bg-blue-500 text-white px-2 py-1 rounded"
                >
                  Copy Link
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <footer className="mt-8 p-4 border-t border-gray-300 text-center ">
        <p>© 2023 Arman</p>
        <div className="flex justify-center space-x-4 mt-2">
          <a href="https://www.linkedin.com/in/shaikh-arman-833325314/" target="_blank" rel="noopener noreferrer" className="text-blue-600">
            LinkedIn
          </a>
          <a href="https://github.com/Arman-dev-1" target="_blank" rel="noopener noreferrer" className="text-gray-800">
            GitHub
          </a>
        </div>
      </footer>

    </div>
  );
}
