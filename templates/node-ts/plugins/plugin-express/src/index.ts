import express from "express";

const app: express.Application = express();

const port: number = parseInt(process.env.PORT) || <%= port%>;

app.use("/", (res, resp) => {
  resp.send("HELLO World");
});

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`);
});