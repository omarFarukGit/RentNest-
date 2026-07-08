import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";
const port = config.port;
const main = async () => {
    try {
        await prisma.$connect();
        console.log("database connect successfully");
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
        });
    }
    catch (error) {
        console.log("database can't connect successfully");
    }
};
main();
//# sourceMappingURL=server.js.map