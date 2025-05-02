const User = require('../User/User');

const Verify = async (req, res) => {
    const { email, verificationCode } = req.body;
    const user = await User.findOne({ email, verification: verificationCode });
    if(user) {
        user.verification = 1;
        await user.save();
        res.status(200).json(user);
    }
};

module.exports = Verify;