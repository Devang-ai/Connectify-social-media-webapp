const { MongoClient } = require('mongodb');

const LOCAL_URI = "mongodb://localhost:27017/connectify";
const REMOTE_URI = "mongodb+srv://chauhandevang075_db_user:yehbhithikhai1@cluster0.xhk9pan.mongodb.net/connectify?appName=Cluster0";

async function migrate() {
    try {
        console.log("1. Connecting to local database...");
        const localClient = await MongoClient.connect(LOCAL_URI);
        const localDb = localClient.db("connectify");
        
        console.log("2. Connecting to remote cloud database...");
        const remoteClient = await MongoClient.connect(REMOTE_URI);
        const remoteDb = remoteClient.db("connectify");

        const collections = await localDb.listCollections().toArray();
        console.log(`\nFound ${collections.length} collections to copy...`);

        for (const collInfo of collections) {
            const collName = collInfo.name;
            
            const localColl = localDb.collection(collName);
            const docs = await localColl.find({}).toArray();
            
            if (docs.length > 0) {
                console.log(`- Copying ${docs.length} records for '${collName}'...`);
                const remoteColl = remoteDb.collection(collName);
                
                // Clear out the remote collection first to prevent duplicate key errors
                try { await remoteColl.drop(); } catch (e) {}
                
                await remoteColl.insertMany(docs);
                console.log(`  ✅ '${collName}' copied successfully!`);
            } else {
                console.log(`- Skipping '${collName}' (Empty)`);
            }
        }

        console.log("\nClosing connections...");
        await localClient.close();
        await remoteClient.close();
        console.log("🎉 MIGRATION COMPLETE! All your data is now in the cloud.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

migrate();
