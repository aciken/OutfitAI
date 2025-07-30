const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

mongoose.connect(process.env.DATABASE_OUTFITS)
    .then(() => console.log('mongodb://localhost:27017/OutfitAI'))
    .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    googleId: String,
    isGoogle: {type: Boolean, default: false},
    verification: String,
    fileId: String,
    createdImages: Array,
});

module.exports = mongoose.model('User', UserSchema);