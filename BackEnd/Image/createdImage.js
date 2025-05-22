const User = require('../User/User');

const createdImage = async (req, res) => {
    const { userID, imageID, outfitId } = req.body;
    const user = await User.findById(userID);
    if(user) {
        user.createdImages.push({ imageId: imageID, outfitId, createdAt: new Date() });
        await user.save();
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = createdImage;