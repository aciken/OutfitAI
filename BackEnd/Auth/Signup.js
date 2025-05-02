const User = require('../User/User');
const dotenv = require('dotenv');
dotenv.config();
const sgMail = require('@sendgrid/mail');


sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const Signup = async (req, res) => {
    const { name, email, password } = req.body;

    const verificationCode = Math.floor(100000 + Math.random() * 900000);


    const msg = {
        to: email,
        from: { name: 'Deeper', email: 'adrian@deepersoftware.com' },
        subject: 'Verification Code',
        text: `Your verification code is: ${verificationCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; width: 100%; background-color: #f5f5f5; padding: 50px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; text-align: center; border-radius: 10px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
              <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Verification Code</h2>
              <p style="font-size: 16px; color: #555; margin-bottom: 20px;">Your verification code is:</p>
              <p style="font-size: 28px; font-weight: 700; color: #007BFF; margin: 20px 0;">${verificationCode}</p>
            </div>
          </div>
        `,
      };


    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    } else {

      await sgMail.send(msg);

        const user = await User.create({ name, email, password, verification: verificationCode });
        res.status(200).json(user);
    }
};

module.exports = Signup;
