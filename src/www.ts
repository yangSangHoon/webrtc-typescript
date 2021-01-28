import app from "./app";
import Signaling from "./signaling";
import {createServer} from "http";

const port: number = Number(process.env.PORT) || 3000;

const server = createServer(app);
server.listen(port, () => {
    console.log(`${port}포트 서버 대기 중!`);
});

const signaling = new Signaling(port);
signaling.setSocketIO(server);

export default server;
