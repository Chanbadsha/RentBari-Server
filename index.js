require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.port || "3000";
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URL;

// Middleware
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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

    const db = client.db("RentBariDB");
    const propertyCollection = db.collection("properties");

    app.get("/", (req, res) => {
      res.send(" RentBari Server Running");
    });

    // Create Property
    app.post("/properties", async (req, res) => {
      try {
        const propertyData = req.body;

        const newProperty = {
          ...propertyData,
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await propertyCollection.insertOne(newProperty);

        res.status(201).send({
          success: true,
          insertedId: result.insertedId,
          message: "Property added successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to add property",
        });
      }
    });

    // Get All Properties
    app.get("/properties", async (req, res) => {
      let filter = {};
      const properties = await propertyCollection.find(filter).toArray();
      res.send(properties);
    });
    // Get Properties by Id
    app.get("/properties/:propertyId", async (req, res) => {
      let filter = {};

      const id = req.params.propertyId;

      if (id) {
        filter._id = new ObjectId(id);
      }

      const properties = await propertyCollection.findOne(filter);
      console.log(properties);
      res.send(properties);
    });

    await client.db("admin").command({ ping: 1 });

    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Error:", error);
  }
}

run().catch(console.dir);

app.listen(port, () => {
  console.log(` Server running on port ${port}`);
});
