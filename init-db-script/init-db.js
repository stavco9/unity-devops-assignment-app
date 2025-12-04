import { MongoClient, ServerApiVersion } from 'mongodb';
import { generateUsername } from "unique-username-generator";
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';
import dotenv from 'dotenv';

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_HOST}/?authSource=%24external&authMechanism=${process.env.DB_AUTH_MECHANISM}&appName=${process.env.DB_NAME}`;

const usersCollectionName = "users";
const itemsCollectionName = "items";
const userCount = 100;
const itemCount = 1000;

const userNumberOfDigits = 3;
const userMaxLength = 15;

const uniqueNamesConfig = {
    dictionaries: [adjectives, colors, animals]
}

const minItemPrice = 10;
const maxItemPrice = 200;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

async function generateUser(numberOfDigits, maxLength) {
    const username = generateUsername("", numberOfDigits, maxLength);
    return {
        username: username,
        email: `${username}@example.com`,
        createdAt: new Date(),
        purchases: []
    };
}

async function generateItem(uniqueNamesConfig, minPrice, maxPrice) {
    const item = uniqueNamesGenerator(uniqueNamesConfig);
    return {
        name: item,
        price: Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice,
        createdAt: new Date(),
        purchasedBy: null
    };
}

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const db = client.db(process.env.DB_NAME);
      // Send a ping to confirm a successful connection
      await db.command({ ping: 1 });

      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      await insert(db, usersCollectionName, userCount, generateUser, userNumberOfDigits, userMaxLength);

      await insert(db, itemsCollectionName, itemCount, generateItem, uniqueNamesConfig, minItemPrice, maxItemPrice);

    } catch (error) {
        console.error(`Failed to run: ${error instanceof Error ? error.message : String(error)}`);
        client.close();
        process.exit(1);
    } finally {
      console.log("Closing client");
      // Ensures that the client will close when you finish/error
      client.close();
      process.exit(0);
    }
}

async function insert(db, collectionName, collectionDesiredCount, insertDataFunction, ...args) {
    try{
        console.log(`Inserting ${collectionName}`);
        if ((await db.listCollections({name: collectionName}).toArray()).length === 0) {
            await db.createCollection(collectionName);
            console.log(`Collection ${collectionName} created`);
        } else {
            console.log(`Collection ${collectionName} already exists`);
        }

        let collectionCount = await db.collection(collectionName).countDocuments();
        let totalToInsert = collectionDesiredCount - collectionCount;

        let insertData = [];

        for (let i = 0; i < totalToInsert; i++) {
            insertData.push(await insertDataFunction(...args));
        }

        if (insertData.length > 0) {
            await db.collection(collectionName).insertMany(insertData);
            console.log(`${totalToInsert} ${collectionName} inserted`);
        } else {
            console.log(`No ${collectionName} to insert`);
        }
    }
    catch (error) {
        throw new Error(`Failed to insert ${collectionName}: ${error}`);
    }
}

await run();