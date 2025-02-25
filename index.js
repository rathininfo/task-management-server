const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 4000;

// Create HTTP server and Socket.io instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.efqwe.mongodb.net/taskManagement?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db("taskManagement");
    const tasksCollection = db.collection("tasks");

    // WebSocket Connection
    io.on("connection", (socket) => {
      console.log("🔗 A user connected");

      socket.on("disconnect", () => {
        console.log("❌ A user disconnected");
      });
    });

    // MongoDB Change Stream to listen for real-time updates
    const changeStream = tasksCollection.watch();
    changeStream.on("change", (change) => {
      io.emit("taskUpdate", change);
    });

    // ✅ Create Task
    app.post("/tasks", async (req, res) => {
      try {
        const newTask = req.body;
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json(result);
        io.emit("taskCreated", newTask);
      } catch (error) {
        res.status(500).json({ error: "Failed to create task" });
      }
    });

    // ✅ Get All Tasks
    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await tasksCollection.find().toArray();
        res.json(tasks);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch tasks" });
      }
    });

    // ✅ Update Task Status
    app.put("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const updatedData = req.body;
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.json(result);
        io.emit("taskUpdated", { id, ...updatedData });
      } catch (error) {
        res.status(500).json({ error: "Failed to update task" });
      }
    });
    

    // ✅ Delete Task
    app.delete("/tasks/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
        res.json(result);
        io.emit("taskDeleted", { id });
      } catch (error) {
        res.status(500).json({ error: "Failed to delete task" });
      }
    });


  } catch (err) {
    console.error("❌ Error connecting to MongoDB:", err);
  }
}

run().catch(console.error);

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("🚀 Real-time Task Management Server is running!");
});

// ✅ Start Server
server.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
