const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.efqwe.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    console.log("Connected to MongoDB!");

    const usersCollection = client.db("taskManagement").collection("users");

    // ✅ User-related API
    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error inserting user:", error);
        res.status(500).json({ error: "Failed to insert user" });
      }
    });

    // ✅ Get all users
    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
      }
    });

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

run().catch(console.error);

// ✅ Root Route
app.get("/", (req, res) => {
  res.send("Server is connected and running!");
});

// ✅ Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
