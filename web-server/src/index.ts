// index.ts
import express from "express";
const app = express();
const port = "3000";

app.get("/", (req, res) => {
  res.send("Hello World from web-server!");
  console.log("Response sent");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
