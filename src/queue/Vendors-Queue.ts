// export default vendorQueue;

import Queue from "bull";
import { vendorService } from "../services/vendors-service";

const vendorQueue = new Queue("vendor-research", {
  redis: { host: "localhost", port: 6379 },
});

vendorQueue.process(3,async (job) => {
  const { query , userId} = job.data;
  console.log("Processing vendor research job:", query);
  const result = await vendorService.processVendorResearch(query, userId);

});

export default vendorQueue;

