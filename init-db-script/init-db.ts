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

const uniqueNamesConfig: Config = {
    dictionaries: [adjectives, colors, animals]
}

const minItemPrice = 10;
const maxItemPrice = 200;
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

async function generateItem(uniqueNamesConfig: Config, minPrice: number, maxPrice: number): Promise<Item> {
    const item = uniqueNamesGenerator(uniqueNamesConfig);
    return {
        name: item,
        price: Math.floor(Math.random() * (maxPrice - minPrice + 1)) + minPrice,
        createdAt: new Date(),
        purchasedBy: null
    };
}

async function run(): Promise<void> {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      const db: Db = client.db(process.env.DB_NAME);
      // Send a ping to confirm a successful connection
      await db.command({ ping: 1 });

      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      await insert<User>(db, usersCollectionName, userCount, generateUser, userNumberOfDigits, userMaxLength, initialUserBalance);

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

async function insert<T>(
    db: Db, 
    collectionName: string, 
    collectionDesiredCount: number, 
    insertDataFunction: (...args: any[]) => Promise<T>, 
    ...args: any[]
): Promise<void> {
    try{
        console.log(`Inserting ${collectionName}`);
        if ((await db.listCollections({name: collectionName}).toArray()).length === 0) {
            await db.createCollection(collectionName);
            console.log(`Collection ${collectionName} created`);
        } else {
            console.log(`Collection ${collectionName} already exists`);
        }

        let collectionCount: number = await db.collection(collectionName).countDocuments();
        let totalToInsert: number = collectionDesiredCount - collectionCount;

        let insertData: any[] = [];

        for (let i = 0; i < totalToInsert; i++) {
            insertData.push(await insertDataFunction(...args));
        }

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

await run();
