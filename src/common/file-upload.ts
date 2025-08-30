import axios from "axios";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";


export async function saveImageLocally(
  imageUrl: string,
  saveDir: string,
  imagePath: string,
  filename: string
): Promise<string> {
  try {
    // הורדת התמונה
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // יצירת תיקייה אם לא קיימת
    await fs.ensureDir(saveDir);

    // יצירת שם ייחודי לקובץ
    const filepath = path.join(saveDir, filename);

    // שמירת התמונה לתיקייה
    await fs.writeFile(filepath, buffer);


    // החזרת הנתיב היחסי לשימוש ב-frontend
    return `${imagePath}/${filename}`;
  } catch (error) {
    console.error("Error saving image locally:", error);
    throw error;
  }
}