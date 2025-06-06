// // src/queue/Vendors-Queue.ts
// import Queue, { Job } from "bull";

// interface VendorJobData {
//   query: string;
//   userId: string;
// }

// const REDIS_HOST = process.env.REDIS_HOST || "10.10.248.153";
// const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);

// const vendorQueue = new Queue<VendorJobData>("vendor-research", {
//   redis: {
//     host: "localhost",
//     port: "6379",
//   },
// });

// vendorQueue.process(3, async (job: Job<VendorJobData>) => {
//   const { query, userId } = job.data;
//   // …
// });

// export default vendorQueue;

import Queue from "bull";
import { vendorService } from "../services/vendors-service";

const vendorQueue = new Queue("vendor-research", {
  redis: { host: "localhost", port: 6379 },
});

vendorQueue.process(3,async (job) => {
  const { query , userId} = job.data;

  console.log(`[Bull] Running research for query: "${query}"`);
  const result = await vendorService.processVendorResearch(query, userId);

  console.log(`[Bull] Done: Found ${result.scrapedVendors.length} vendors of type ${result.vendorType}`);
});

export default vendorQueue;