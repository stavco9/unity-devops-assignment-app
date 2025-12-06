import { MongoClient, ServerApiVersion } from "mongodb";
import type { Db, Filter, Document, WithId, UpdateFilter, UpdateResult } from "mongodb";
import type { MongoDbConfig } from "../config/config.js";
import logger from "../utils/logger.js";

// Mongo service class. Handles the MongoDB operations.
export class MongoService {
    private client: MongoClient;
    private db: Db;

    // Constructor. Initializes the MongoDB client and database.
    constructor(config: MongoDbConfig) {
        try {
            const uri = `mongodb+srv://${config.dbHost}/?authSource=%24external&authMechanism=${config.dbAuthMechanism}&appName=${config.dbName}`;
            this.client = new MongoClient(uri, {serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
              }});
            this.db = this.client.db(config.dbName);
        } catch (error) {
            throw new Error(
                `Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Connect to the MongoDB cluster.
    async connect(): Promise<void> {
        try {
            await this.client.connect();
            logger.info("MongoDB connected");
        } catch (error) {
            throw new Error(
                `Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Disconnect from the MongoDB cluster.
    async disconnect(): Promise<void> {
        try {
            await this.client.close();
            logger.info("MongoDB disconnected");
        } catch (error) {
            throw new Error(
                `Failed to disconnect from MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Perform a simple query on the specified collection.
    async simpleQuery(collectionName: string, query: Filter<Document>): Promise<WithId<Document>[]> {
        try {
            const collection = this.db.collection<Document>(collectionName);
            const result = await collection.find(query).toArray();
            return result;
        } catch (error) {
            throw new Error(
                `Failed to query MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Perform an aggregate query on the specified collection with a sample size.
    async aggregateSampleQuery(collectionName: string, query: Filter<Document>, count: number): Promise<Document> {
        try {
            const collection = this.db.collection<Document>(collectionName);
            const result = await collection.aggregate([{ $match: query }, { $sample: { size: count } }]).toArray();
            return result;
        } catch (error) {
            throw new Error(
                `Failed to query MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Perform an aggregate join query on the specified collection.
    async aggregateJoinQuery(collectionName: string, query: Filter<Document>, lookup: Filter<Document>): Promise<Document> {
        try {
            const collection = this.db.collection<Document>(collectionName);
            const result = await collection.aggregate([{ $match: query }, { $lookup: lookup }]).toArray();
            return result;
        } catch (error) {
            throw new Error(
                `Failed to query MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    // Update a single document in the specified collection.
    async updateSingleDocument(collectionName: string, query: Filter<Document>, update: UpdateFilter<Document> | Document[]): Promise<void> {
        try {
            const collection = this.db.collection<Document>(collectionName);
            await collection.updateOne(query, update);
            logger.info(`Updated ${collectionName} document with query ${JSON.stringify(query)} and update ${JSON.stringify(update)}`);
        } catch (error) {
            throw new Error(
                `Failed to update MongoDB: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}