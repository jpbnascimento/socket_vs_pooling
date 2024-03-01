const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const app = express();
const server = createServer(app);

/* === BEGIN POOLING === */
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("messages.db");
db.serialize(() =>
  db.run("CREATE TABLE IF NOT EXISTS messages (message TEXT)")
);

app.get("/pooling", (req, res) => {
  res.sendFile(join(__dirname, "pooling.html"));
});

app.get("/add/:message", (req, res) => {
  const stmt = db.prepare("INSERT INTO messages VALUES (?)");
  stmt.run(req.params.message);
  stmt.finalize();
  res.json({ message: "success" });
});

app.get("/messages", (req, res) => {
  db.serialize(() => {
    db.all("SELECT * FROM messages", (err, rows) => res.json(rows));
  });
});
/* === END POOLING === */

/* === BEGIN SOCKET === */
const { Server } = require("socket.io");
const io = new Server(server);

app.get("/socket", (req, res) => {
  res.sendFile(join(__dirname, "socket.html"));
});

io.on("connection", (socket) => {
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
});
/* === END SOCKET === */

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
