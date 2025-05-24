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