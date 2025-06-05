import axios from "axios";
import fs from "fs";
import path from "path";

export async function downloadImageToServer(
  imageUrl: string,
  folderPath: string,
  fileName: string
): Promise<string> {
  try {
    // וודא שהתיקייה קיימת
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const filePath = path.join(folderPath, fileName);

    // מוריד את התמונה
    const response = await axios({
      method: "GET",
      url: imageUrl,
      responseType: "stream",
    });

    // שומר את התמונה בקובץ
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath)); // מחזיר נתיב מלא במערכת
      writer.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading image:", error);
    throw error;
  }
}