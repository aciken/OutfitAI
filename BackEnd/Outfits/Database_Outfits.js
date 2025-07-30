const mongoose = require('mongoose');
require('dotenv').config();

// Create a separate connection for Outfits database
let outfitsConnection = null;

// Define the Outfit Schema
const outfitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  file: {
    type: String,
    required: true
  },
  keywords: [{
    type: String
  }],
  items: [{
    type: String
  }]
}, {
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Define the Item Schema (flexible schema for items collection)
const itemSchema = new mongoose.Schema({}, { 
  strict: false, // This allows any fields to be stored
  timestamps: true // This adds createdAt and updatedAt fields automatically
});

// Database connection function for Outfits only
const connectToOutfitsDatabase = async () => {
  try {
    const mongoUri = process.env.DATABASE_OUTFITS;
    
    if (!mongoUri) {
      throw new Error('DATABASE_OUTFITS environment variable is not set');
    }

    console.log('MongoDB URI for Outfits:', mongoUri);
    console.log('Connecting to MongoDB Atlas for Outfits...');
    
    // Create a separate connection
    outfitsConnection = mongoose.createConnection(mongoUri);
    
    outfitsConnection.on('connected', () => {
      console.log('✅ Successfully connected to MongoDB Atlas (Outfits Database)');
      console.log('📊 Outfits Database name:', outfitsConnection.db.databaseName);
    });

    outfitsConnection.on('error', (error) => {
      console.error('❌ Outfits MongoDB connection error:', error.message);
    });

    // Wait for connection to be established
    await new Promise((resolve, reject) => {
      outfitsConnection.once('open', resolve);
      outfitsConnection.once('error', reject);
    });
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Function to get all outfits (Express route handler)
const getAllOutfits = async (req, res) => {
  try {
    console.log('🔍 DATABASE_OUTFITS env var:', process.env.DATABASE_OUTFITS);
    
    // Ensure we're connected to the Outfits database
    if (!outfitsConnection || outfitsConnection.readyState !== 1) {
      console.log('Outfits database not connected, connecting now...');
      await connectToOutfitsDatabase();
    } else {
      console.log("✅ Connected to Outfits database");
    }

    console.log('📊 Outfits database name:', outfitsConnection.db.databaseName);
    console.log('🔗 Outfits connection state:', outfitsConnection.readyState);
    
    // Create the model on the specific connection
    const Outfit = outfitsConnection.model('Outfit', outfitSchema, 'Outfits');
    
    // Let's try to list all collections first
    console.log('📂 Listing all collections in Outfits database...');
    const collections = await outfitsConnection.db.listCollections().toArray();
    console.log('📂 Available collections in Outfits DB:', collections.map(c => c.name));
    
    console.log('🔍 Fetching all outfits from "Outfits" collection...');
    const outfits = await Outfit.find({});
    
    console.log(`📦 Found ${outfits.length} outfits in database`);
    
    if (outfits.length === 0) {
      console.log('❌ No outfits found. Let me try a different approach...');
      
      // Try using the native MongoDB driver
      const collection = outfitsConnection.db.collection('Outfits');
      const nativeResult = await collection.find({}).toArray();
      console.log(`🔍 Native query result: ${nativeResult.length} documents`);
      
      if (nativeResult.length > 0) {
        console.log('📋 Sample document from native query:', nativeResult[0]);
      }
    } else {
      outfits.forEach((outfit, index) => {
        console.log(`${index + 1}. ${outfit.name} (${outfit.keywords?.length || 0} keywords, ${outfit.items?.length || 0} items)`);
      });
    }
    
    // Return the outfits as JSON response
    res.status(200).json(outfits);
  } catch (error) {
    console.error('❌ Error fetching outfits:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch outfits', 
      message: error.message 
    });
  }
};

// Function to get all items (Express route handler)
const getAllItems = async (req, res) => {
  try {
    console.log('🔍 DATABASE_OUTFITS env var:', process.env.DATABASE_OUTFITS);
    
    // Ensure we're connected to the Outfits database
    if (!outfitsConnection || outfitsConnection.readyState !== 1) {
      console.log('Outfits database not connected, connecting now...');
      await connectToOutfitsDatabase();
    } else {
      console.log("✅ Connected to Outfits database");
    }

    console.log('📊 Outfits database name:', outfitsConnection.db.databaseName);
    console.log('🔗 Outfits connection state:', outfitsConnection.readyState);
    
    // Create the model on the specific connection
    const Item = outfitsConnection.model('Item', itemSchema, 'Items');
    
    // Let's try to list all collections first
    console.log('📂 Listing all collections in Outfits database...');
    const collections = await outfitsConnection.db.listCollections().toArray();
    console.log('📂 Available collections in Outfits DB:', collections.map(c => c.name));
    
    console.log('🔍 Fetching all items from "Items" collection...');
    const items = await Item.find({});
    
    console.log(`📦 Found ${items.length} items in database`);
    
    if (items.length === 0) {
      console.log('❌ No items found. Let me try a different approach...');
      
      // Try using the native MongoDB driver
      const collection = outfitsConnection.db.collection('Items');
      const nativeResult = await collection.find({}).toArray();
      console.log(`🔍 Native query result: ${nativeResult.length} documents`);
      
      if (nativeResult.length > 0) {
        console.log('📋 Sample document from native query:', nativeResult[0]);
      }
    } else {
      items.forEach((item, index) => {
        console.log(`${index + 1}. Item ID: ${item._id}`);
        console.log(`   Fields: ${Object.keys(item.toObject()).filter(key => !key.startsWith('_') && key !== 'createdAt' && key !== 'updatedAt').join(', ')}`);
      });
    }
    
    // Return the items as JSON response
    res.status(200).json(items);
  } catch (error) {
    console.error('❌ Error fetching items:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch items', 
      message: error.message 
    });
  }
};

// Export both getAllOutfits and getAllItems
module.exports = {
  getAllOutfits,
  getAllItems
};

// If this file is run directly, test the connection and fetch outfits
if (require.main === module) {
  initializeDatabase()
    .then((outfits) => {
      console.log('\n🎉 Database test completed successfully!');
      console.log(`Total outfits in database: ${outfits.length}`);
      
      // Close the connection when done
      outfitsConnection.close();
    })
    .catch((error) => {
      console.error('\n💥 Database test failed:', error.message);
      process.exit(1);
    });
}
