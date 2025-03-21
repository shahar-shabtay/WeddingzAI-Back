import { useState } from "react";
import styles from "./JsonUploader.module.css";
import uploadJsonFile from "../../services/file-service";

export default function JsonUploader() {
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== "application/json") {
      setFileError("Please upload a valid JSON file.");
      setFileName(null);
      setFile(null);
      return;
    }

    setFileName(selectedFile.name);
    setFileError(null);
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      setFileError("No file selected.");
      return;
    }

    try {
      const response = await uploadJsonFile.uploadJsonFile(file);
      alert(response.data.message);
      setFileError(null);
    } catch (error: any) {
      setFileError(error.response?.data?.error || "Upload failed.");
    }
  };

  return (
    <div className={styles.centerContainer}>
      <div className={styles.jsonUploaderContainer}>
        <h2>Upload a JSON File</h2>
        <p>Select a JSON file to validate its format.</p>
        <input type="file" accept=".json" onChange={handleFileChange} />
        <button className={styles.uploadButton} onClick={handleSubmit}>Submit</button>
        {fileName && <p className={styles.successMessage}>Uploaded: {fileName}</p>}
        {fileError && <p className={styles.errorMessage}>{fileError}</p>}
      </div>
    </div>
  );
}
