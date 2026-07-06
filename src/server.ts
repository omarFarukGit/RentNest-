import app from "./app";
import config from "./config";
import { prisma } from "./lib/prisma";

const port = config.port;
const main = async () => {
  try {
    await prisma.$connect();
    console.log("database connect successfully");
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  } catch (error) {
    console.log("database can't connect successfully");
  }
};

main();
