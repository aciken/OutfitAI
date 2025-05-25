const User = require('../User/User');

const newImage = async (req, res) => {
    const { userID, newFileId } = req.body;
    const user = await User.findById(userID);
    if(user) {
        user.fileId = newFileId;
        await user.save();
        res.status(200).json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = newImage;