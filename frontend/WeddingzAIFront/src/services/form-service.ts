import apiClient from "./api-client";

interface UploadResponse {
  message: string;
  fileName: string;
  todoList: string;
}

const uploadFormJson = async (formJson: File) => {
  const formData = new FormData();
  formData.append("file", formJson);

  const response = await apiClient.post<UploadResponse>("/upload-form", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response;
};

export default { uploadFormJson };
