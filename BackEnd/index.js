const express = require('express');
const app = express();
const port = 3000;
app.use(express.json());
const cors = require('cors');
app.use(cors());

const Signup = require('./Auth/Signup');
const Signin = require('./Auth/signin');
const Verify = require('./Auth/verify');


app.get('/', (req, res) => {
    res.send('Hello World!');
  });


  app.put('/signup', Signup);
  app.post('/signin', Signin);
  app.put('/verify', Verify);
  
  app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
  });