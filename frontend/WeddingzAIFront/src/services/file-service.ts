import apiClient from "./api-client";

interface UploadResponse {
  message: string;
  fileName: string;
}

const uploadJsonFile = async (json: File) => {
  const formData = new FormData();
  formData.append("file", json);

  const response = await apiClient.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response;
};

export default { uploadJsonFile };
