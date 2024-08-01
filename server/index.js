import express from "express";
import client from "./db.js";
import customerRouter from "./routers/customerRouter.js";
import workerRouter from "./routers/workerRouter.js";
import dotenv from "dotenv"
dotenv.config()

const app = express();

app.use(express.json());

app.use("/customer", customerRouter);
app.use("/worker", workerRouter);

let server = app.listen(5000, async () => {
  try {
    await client.connect();
    console.log(
      `Server is running on port ${server.address().port} and connected to DB`
    );
  } catch (err) {
    console.error("Failed to connect to the database", err);
  }
});
