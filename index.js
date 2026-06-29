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
    // await client.connect();

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

    // Delete Property
    app.delete("/properties/:propertyId", async (req, res) => {
      try {
        const propertyId = req.params.propertyId;

        const result = await propertyCollection.deleteOne({
          _id: new ObjectId(propertyId),
        });

        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Property not found",
          });
        }

        res.status(200).send({
          success: true,
          deletedCount: result.deletedCount,
          message: "Property deleted successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to delete property",
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
      const status = req.query.status;
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
      if (status) {
        filter.status = {
          $regex: status,
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
      let sort = {};

      if (sortBy) {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }
      const properties = await propertyCollection
        .find(filter)
        .limit(limit)
        .sort(sort)
        .toArray();
      res.send(properties);
    });
    // Get All Properties
    app.get("/admin/properties", async (req, res) => {
      let filter = {};

      const status = req.query.status;

      if (status) {
        filter.status = {
          $regex: status,
          $options: "i",
        };
      }
      const properties = await propertyCollection
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

    // Update Property
    app.patch("/properties/:propertyId", async (req, res) => {
      try {
        const updateData = req.body;
        const propertyId = req.params.propertyId;

        const result = await propertyCollection.updateOne(
          { _id: new ObjectId(propertyId) },
          { $set: updateData },
        );

        res.status(200).send({
          success: true,
          message: "Booking updated successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to update booking",
        });
      }
    });

    // Get Bookings by OwnerId
    app.get("/bookings", async (req, res) => {
      let filter = {};
      const propertyOwnerId = req.query.propertyOwnerId;
      const userId = req.query.userId;
      const bookingStatus = req.query.bookingStatus;

      if (userId) {
        filter.userId = userId;
      }

      if (propertyOwnerId) {
        filter.propertyOwnerId = propertyOwnerId;
      }
      if (bookingStatus) {
        filter.bookingStatus = bookingStatus;
      }

      const bookings = await bookingCollection
        .aggregate([
          { $match: filter },

          // Convert ids to ObjectId
          {
            $addFields: {
              ObjectPropertyId: { $toObjectId: "$propertyId" },
              ObjectUserId: { $toObjectId: "$userId" },
              ObjectPropertyOwnerId: { $toObjectId: "$propertyOwnerId" },
            },
          },

          // Property lookup
          {
            $lookup: {
              from: "properties",
              localField: "ObjectPropertyId",
              foreignField: "_id",
              as: "property",
            },
          },
          { $unwind: "$property" },

          // User lookup
          {
            $lookup: {
              from: "user",
              localField: "ObjectUserId",
              foreignField: "_id",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
              preserveNullAndEmptyArrays: true,
            },
          },
          // Property Owner lookup
          {
            $lookup: {
              from: "user",
              localField: "ObjectPropertyOwnerId",
              foreignField: "_id",
              as: "propertyOwner",
            },
          },
          { $unwind: "$propertyOwner" },

          // Remove unnecessary fields
          {
            $project: {
              ObjectPropertyId: 0,
              ObjectUserId: 0,

              "property.status": 0,
              // "property.createdAt": 1,
              "property.updatedAt": 0,

              "user.password": 0,
              "user._id": 0,
              "user.createdAt": 0,
              "user.updatedAt": 0,
            },
          },
          { $sort: { "property.createdAt": -1 } },
        ])
        .toArray();

      res.send(bookings);
    });

    // Update Booking
    app.patch("/bookings/:bookingId", async (req, res) => {
      try {
        const updateData = req.body;
        const bookingId = req.params.bookingId;

        const status = updateData.status;

        const result = await bookingCollection.updateOne(
          { _id: new ObjectId(bookingId) },
          { $set: { bookingStatus: status } },
        );

        res.status(200).send({
          success: true,
          message: "Booking updated successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to update booking",
        });
      }
    });
    // Delete Booking
    app.delete("/bookings/:bookingId", async (req, res) => {
      try {
        const bookingId = req.params.bookingId; // Get the bookingId from the URL path
        const result = await bookingCollection.deleteOne({
          _id: new ObjectId(bookingId),
        }); // Delete the booking with the specified ID
        if (result.deletedCount === 0) {
          return res.status(404).send({
            success: false,
            message: "Booking not found",
          });
        }
        res.status(200).send({
          success: true,
          deletedCount: result.deletedCount,
          message: "Booking deleted successfully",
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to delete booking",
        });
      }
    });

    // Get All Users
    app.get("/users", async (req, res) => {
      let filter = {};
      const userId = req.query.userId;
      const location = req.query.location;
      const limit = Number(req.query.limit);
      const sortBy = req.query.sortBy;
      const sortOrder = req.query.sortOrder;
      if (location) {
        filter.location = {
          $regex: location,
          $options: "i",
        };
      }
      if (userId) {
        filter.userId = userId;
      }
      let sort = {};

      if (sortBy) {
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;
      }
      const users = await userCollection
        .find(filter)
        .limit(limit)
        .sort(sort)
        .toArray();
      res.send(users);
    });

    // Update User
    app.patch("/user", async (req, res) => {
      try {
        const updateData = req.body;
        const userId = updateData.userId;

        const favorites = updateData.favorites;
        const userStatus = updateData.userStatus;
        const userRole = updateData.userRole;
        if (userRole) {
          const result = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { userRole } },
          );
        }

        if (userStatus) {
          const result = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { userStatus } },
          );
        }

        if (favorites) {
          const result = await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { favorites } },
          );
        }

        res.status(200).send({
          success: true,
          message: "User updated successfully",
        });
      } catch (error) {
        console.error(error);

        res.status(500).send({
          success: false,
          message: "Failed to update user",
        });
      }
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
