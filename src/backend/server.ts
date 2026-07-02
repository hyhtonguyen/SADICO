import express from "express";

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.get("/", (_req, res) => {
  res.json({
    message: "SADICO CMMS is now using the SQL Server-backed ASP.NET Core backend.",
    backend: "http://localhost:5000",
    status: "ok",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: "sql-server", backend: "http://localhost:5000" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "sql-server", backend: "http://localhost:5000" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[SADICO CMMS] Lightweight server running on http://0.0.0.0:${PORT}`);
  console.log("The app now relies on the ASP.NET Core backend and SQL Server data source.");
});
