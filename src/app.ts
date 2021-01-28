import express from 'express';

const app: express.Application = express();

app.use("/", express.static(__dirname + "/"));

/*app.get(
    "/",
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.sendFile(`${__dirname}/index.html`);
    }
);*/

export default app;
