import initApp from "./server";
import https from "https";
import fs from "fs";

initApp()
  .then((app) => {
    if(process.env.NODE_ENV !== 'production') {
      console.log("development");
      app.listen(process.env.PORT, () => {
        console.log(`App is listening at ${process.env.PORT}`);
      });
    } else {
      const options ={
        key: fs.readFileSync('./client-key.pem'),
        cert: fs.readFileSync('./client-cert.pem')
      };
      https.createServer(options, app).listen(process.env.PORT)
    }
  });