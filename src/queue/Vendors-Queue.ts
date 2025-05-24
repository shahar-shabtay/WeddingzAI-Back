// src/queue/Vendors-Queue.ts
import Queue, { Job } from "bull";

interface VendorJobData {
  query: string;
  userId: string;
}

const REDIS_HOST = process.env.REDIS_HOST || "10.10.248.153";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

const vendorQueue = new Queue<VendorJobData>("vendor-research", {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

vendorQueue.process(3, async (job: Job<VendorJobData>) => {
  const { query, userId } = job.data;
  // …
});

export default vendorQueue;