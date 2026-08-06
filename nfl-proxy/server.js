import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(cors());

app.get("/api", async (req, res) => {
  try {
    const path = req.query.path;

    const response = await fetch(`https://nflmeta.org/api/v1/${path}`, {
      headers: {
        "X-NFLMeta-Key": process.env.NFLMETA_APIKEY_BACKUP,
      },
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch NFLMeta" });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
