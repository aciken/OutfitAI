const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

mongoose.connect('mongodb://localhost:27017/OutfitAI')
    .then(() => console.log('mongodb://localhost:27017/OutfitAI'))
    .catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    googleId: String,
    isGoogle: {type: Boolean, default: false},
    verification: String,
});

module.exports = mongoose.model('User', UserSchema);