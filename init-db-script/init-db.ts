import { MongoClient, ServerApiVersion, Db, Collection } from 'mongodb';
import { generateUsername } from "unique-username-generator";
import { uniqueNamesGenerator, adjectives, colors, animals, Config } from 'unique-names-generator';
import dotenv from 'dotenv';

dotenv.config();

const uri = `mongodb+srv://${process.env.DB_HOST}/?authSource=%24external&authMechanism=${process.env.DB_AUTH_MECHANISM}&appName=${process.env.DB_NAME}`;

const usersCollectionName = "users";
const itemsCollectionName = "items";
const userCount = 100;
const itemCount = 1000;

const userNumberOfDigits = 3;
const userMaxLength = 15;

// Set the configuration for the unique names generator for the items.
// The items names will be generated using the adjectives, colors and animals dictionaries.
const uniqueNamesConfig: Config = {
    dictionaries: [adjectives, colors, animals]
}

// The minimum and maximum available price of the items.
const minItemPrice = 10;
const maxItemPrice = 200;

// The initial balance of the users.
const initialUserBalance = 1000;

interface User {
    username: string;
    email: string;
    createdAt: Date;
    purchases: string[];
    balance: number;
}

interface Item {
    name: string;
    price: number;
    createdAt: Date;
    purchasedBy: null;
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
});

// Generate a random user with a random username, email and a fixed balance.
async function generateUser(numberOfDigits: number, maxLength: number, balance: number): Promise<User> {
    const username = generateUsername("", numberOfDigits, maxLength);
    return {
        username: username,
        email: `${username}@example.com`,
        createdAt: new Date(),
        purchases: [] as string[],
        balance: balance
    };
}

// Generate a random item with a random name, price and set the purchased by field to null since it's not purchased yet.
async function generateItem(uniqueNamesConfig: Config, minPrice: number, maxPrice: number): Promise<Item> {
    const item = uniqueNamesGenerator(uniqueNamesConfig);
    return {
        name: item,
        price: Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice,
        createdAt: new Date(),
        purchasedBy: null
    };
}

// Run the script to insert the users and items into the database.
async function run(): Promise<void> {
    try {
      // Connect the client to the MongoDB cluster.
      await client.connect();
      const db: Db = client.db(process.env.DB_NAME);

      // Send a ping to confirm a successful connection
      await db.command({ ping: 1 });

      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      // Insert the users into the database.
      await insert<User>(db, usersCollectionName, userCount, generateUser, userNumberOfDigits, userMaxLength, initialUserBalance);

      // Insert the items into the database.
      await insert<Item>(db, itemsCollectionName, itemCount, generateItem, uniqueNamesConfig, minItemPrice, maxItemPrice);

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

// Insert the data into the specified collection.
// It's a generic function that can be used to insert any type of data into any collection.
// It's also creates the collection if it doesn't exist.
async function insert<T>(
    db: Db, 
    collectionName: string, 
    collectionDesiredCount: number, 
    insertDataFunction: (...args: any[]) => Promise<T>, 
    ...args: any[]
): Promise<void> {
    try{
        // Check if the collection exists and create it if it doesn't.
        console.log(`Inserting ${collectionName}`);
        if ((await db.listCollections({name: collectionName}).toArray()).length === 0) {
            await db.createCollection(collectionName);
            console.log(`Collection ${collectionName} created`);
        } else {
            console.log(`Collection ${collectionName} already exists`);
        }

        // Get the current count of documents in the collection.
        let collectionCount: number = await db.collection(collectionName).countDocuments();

        // Calculate the number of documents to insert.
        let totalToInsert: number = collectionDesiredCount - collectionCount;

        let insertData: any[] = [];

        // Build the object to insert by the insertDataFunction parameter based on the object type.
        for (let i = 0; i < totalToInsert; i++) {
            insertData.push(await insertDataFunction(...args));
        }

        // Insert the documents into the collection if there are any to insert.
        if (insertData.length > 0) {
            await db.collection(collectionName).insertMany(insertData);
            console.log(`${totalToInsert} ${collectionName} inserted`);
        } else {
            console.log(`No ${collectionName} to insert, there are already ${collectionCount} documents in the collection`);
        }
    }
    catch (error) {
        throw new Error(`Failed to insert ${collectionName}: ${error}`);
    }
}

// Run the script to insert the users and items into the database.
await run();
