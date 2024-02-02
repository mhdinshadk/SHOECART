require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const express = require('express');
const app = express();
mongoose.connect(process.env.MONGO_URI).then(()=>{
	console.log('database connected')
})



// Setting public folder
app.use('/static', express.static(path.join(__dirname, 'public')));
// app.use('/static', express.static(path.join(__dirname, 'public')));


// Setting view engine
app.set('view engine', 'ejs');
app.set('views', './views/users');

//--------cache controlling ----\\
const disable = (req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '1');
    next(); 
  }
  app.use(disable);


const userRoute = require('./routes/userRoute')
app.use('/', userRoute)

const adminRoute = require('./routes/adminRoute')
app.use('/admin', adminRoute)

app.use('*', (req, res) => {
  res.render('404')
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port at http://localhost:${PORT}`);
});
