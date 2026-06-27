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
    const bookingCollection = db.collection("bookings");
    const userCollection = db.collection("user");

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
    // Booking Property
    app.post("/bookings", async (req, res) => {
      try {
        const bookingData = req.body;
        // const propertyId = bookingData.propertyId;
        // const userId = bookingData.userId;
        // const startDate = bookingData.startDate;
        // const endDate = bookingData.endDate;
        // const status = bookingData.status;

        const newBooking = {
          ...bookingData,
          bookingStatus: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const result = await bookingCollection.insertOne(newBooking);

        res.status(201).send({
          success: true,
          insertedId: result.insertedId,
          message: "Booking added successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to add booking",
        });
      }
    });

    // Get All Properties
    app.get("/properties", async (req, res) => {
      let filter = {};
      const userId = req.query.userId;
      const location = req.query.location;
      const propertyType = req.query.propertyType;
      const minPrice = Number(req.query.minPrice);
      const maxPrice = Number(req.query.maxPrice);
      const limit = Number(req.query.limit);
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder;
      if (location) {
        filter.location = {
          $regex: location,
          $options: "i",
        };
      }
      if (propertyType) {
        filter.propertyType = {
          $regex: `^${propertyType}$`,
          $options: "i",
        };
      }
      if (minPrice || maxPrice) {
        filter.rentPrice = {};

        if (minPrice) {
          filter.rentPrice.$gte = minPrice;
        }

        if (maxPrice) {
          filter.rentPrice.$lte = maxPrice;
        }
      }
      if (userId) {
        filter.userId = userId;
      }

      const properties = await propertyCollection
        .find(filter)
        .limit(limit)
        .sort({ [sortBy]: sortOrder })
        .toArray();
      res.send(properties);
    });
    // Get Properties by Id
    app.get("/properties/:propertyId", async (req, res) => {
      let filter = {};

      const id = req.params.propertyId;

      if (id) {
        filter._id = new ObjectId(id);
      }

      const [property] = await propertyCollection
        .aggregate([
          { $match: filter },
          { $addFields: { userId: { $toObjectId: "$userId" } } },
          {
            $lookup: {
              from: "user",
              localField: "userId",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
          {
            $project: {
              userObjectId: 0,
              "user._id": 0,
              "user.password": 0,
              "user.createdAt": 0,
              "user.updatedAt": 0,
            },
          },
        ])
        .toArray();

      res.send(property);
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
