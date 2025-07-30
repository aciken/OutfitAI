const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
const cors = require('cors');
app.use(cors());

const Signup = require('./Auth/Signup');
const Signin = require('./Auth/signin');
const Verify = require('./Auth/verify');
const createdImage = require('./Image/createdImage');
const newImage = require('./Image/newImage');
const Google = require('./Auth/google');
const outfit = require('./Outfits/Database_Outfits');

app.get('/', (req, res) => {
    res.send('Hello World!');
  });


  app.put('/signup', Signup);
  app.post('/signin', Signin);
  app.put('/verify', Verify);
  app.put('/createdImage', createdImage);
  app.put('/newImage', newImage);
  app.put('/google', Google);
  app.get('/getAllOutfits', outfit.getAllOutfits);
  app.get('/getAllItems', outfit.getAllItems);
  

  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });