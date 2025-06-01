const User = require('../User/User');

const Google = async (req, res) => {
    const { id, email, name } = req.body;
    const user = await User.findOne({ email });
    if(user) {
        res.status(200).json(user);
        console.log(user.tasks)
    } else {
        const user = await User.create({ 
            name, 
            email, 
            googleId: id, 
            isGoogle: true,
            verification: 1
        });
        console.log(user.tasks)
        res.status(200).json(user);
    }
};

module.exports = Google;