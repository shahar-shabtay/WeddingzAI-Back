import axios from "axios";
import fs from "fs/promises";
import path from "path";


export async function saveImageFromUrl(
  imageUrl: string,
  savePath: string,
  deleteOld: boolean = false
): Promise<string> {
  if (deleteOld) {
    try {
      await fs.unlink(savePath);
    } catch (err: any) {
      if (err.code !== "ENOENT") throw err;
    }
  }

  await fs.mkdir(path.dirname(savePath), { recursive: true });

  const res = await axios.get(imageUrl, { responseType: "arraybuffer" });
  await fs.writeFile(savePath, res.data);

  return savePath;
}