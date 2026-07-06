import express from "express";
import cors from "cors";
import adminRouter from "./routes/admin";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", adminRouter);

export default app;