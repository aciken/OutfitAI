const mongoose = require('mongoose');
require('dotenv').config();

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

// Create the Outfit model
const Outfit = mongoose.model('Outfit', outfitSchema);

// Database connection function
const connectToDatabase = async () => {
  try {
    const mongoUri = process.env.DATABASE_OUTFITS;
    
    if (!mongoUri) {
      throw new Error('DATABASE_OUTFITS environment variable is not set');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Successfully connected to MongoDB (Outfits Database)');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
};

// Function to get all outfits
const getAllOutfits = async () => {
  try {
    console.log('Fetching all outfits from database...');
    const outfits = await Outfit.find({});
    
    console.log(`📦 Found ${outfits.length} outfits in database:`);
    outfits.forEach((outfit, index) => {
      console.log(`${index + 1}. ${outfit.name} (${outfit.keywords.length} keywords, ${outfit.items.length} items)`);
    });
    
    return outfits;
  } catch (error) {
    console.error('❌ Error fetching outfits:', error.message);
    throw error;
  }
};

// Function to get a specific outfit by ID
const getOutfitById = async (outfitId) => {
  try {
    console.log(`Fetching outfit with ID: ${outfitId}`);
    const outfit = await Outfit.findById(outfitId);
    
    if (!outfit) {
      console.log(`❌ No outfit found with ID: ${outfitId}`);
      return null;
    }
    
    console.log(`✅ Found outfit: ${outfit.name}`);
    return outfit;
  } catch (error) {
    console.error('❌ Error fetching outfit by ID:', error.message);
    throw error;
  }
};

// Function to get outfits by keyword
const getOutfitsByKeyword = async (keyword) => {
  try {
    console.log(`Searching for outfits with keyword: ${keyword}`);
    const outfits = await Outfit.find({ 
      keywords: { $regex: keyword, $options: 'i' } // Case-insensitive search
    });
    
    console.log(`📦 Found ${outfits.length} outfits matching keyword "${keyword}"`);
    return outfits;
  } catch (error) {
    console.error('❌ Error searching outfits by keyword:', error.message);
    throw error;
  }
};

// Function to add a new outfit (bonus functionality)
const addOutfit = async (outfitData) => {
  try {
    console.log(`Adding new outfit: ${outfitData.name}`);
    const newOutfit = new Outfit(outfitData);
    const savedOutfit = await newOutfit.save();
    
    console.log(`✅ Successfully added outfit: ${savedOutfit.name} (ID: ${savedOutfit._id})`);
    return savedOutfit;
  } catch (error) {
    console.error('❌ Error adding outfit:', error.message);
    throw error;
  }
};

// Main function to initialize and test the database connection
const initializeDatabase = async () => {
  try {
    await connectToDatabase();
    const outfits = await getAllOutfits();
    return outfits;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
};

// Export all functions
module.exports = {
  connectToDatabase,
  getAllOutfits,
  getOutfitById,
  getOutfitsByKeyword,
  addOutfit,
  initializeDatabase,
  Outfit // Export the model in case you need it elsewhere
};

// If this file is run directly, test the connection and fetch outfits
if (require.main === module) {
  initializeDatabase()
    .then((outfits) => {
      console.log('\n🎉 Database test completed successfully!');
      console.log(`Total outfits in database: ${outfits.length}`);
      
      // Close the connection when done
      mongoose.connection.close();
    })
    .catch((error) => {
      console.error('\n💥 Database test failed:', error.message);
      process.exit(1);
    });
}
