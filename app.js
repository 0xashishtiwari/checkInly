if(process.env.NODE_ENV != "production"){
  require('dotenv').config()
 
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const PORT = process.env.PORT;

const dbUrl = process.env.ATLASDB_URL;



const path = require('path');
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate');

const ExpressError = require('./utils/ExpressError');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const ListingRouter = require('./routes/listing.js');
const ReviewRouter = require('./routes/review.js');
const UserRouter = require('./routes/user.js');


app.use(express.static(path.join(__dirname,'/public')));
app.set('view engine' , 'ejs');
app.set('views' , path.join(__dirname , '/views'));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(methodOverride('_method'))
app.engine('ejs', ejsMate);

app.use((req, res, next)=>{
  res.locals.query = req.query;
  next();
})



const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto :  {
      secret : process.env.SECRET
    },
    touchAfter : 24 * 3600
  });

  store.on('error' , ()=>{
    console.log("Error in mongo session store");
  });

const sessionOptions = {
  store : store ,
  secret :  process.env.SECRET,
  resave : false,
  saveUninitialized : true,
  cookie:{
    expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge : 7 * 24 * 60 * 60 * 1000,
    httpOnly : true
  }
};




async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log("Connected to database successfully");
  } catch (err) {
    console.error("Database connection error:", err);
  }
}
main();

app.get("/", (req, res) => {
  res.redirect('/listings');
});

app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



// app.get("/demouser", async(req, res) => {
//  let fakeuser = new User({
//   email : "abc@gmail.com",
//   username : "ashish_232"
//  });

//  let registereduser = await User.register(fakeuser , "hellworld");
//   res.send(registereduser);
// });


app.use((req, res,next)=>{

    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currUser = req.user;
    next();
});

//-------------routes------------

app.use('/listings' , ListingRouter);
app.use('/listings/:id/reviews'  , ReviewRouter);
app.use('/'  , UserRouter);

// app.get('/testListing' , async (req, res)=>{
//     let sampleListing = new Listing({
//         title : "My New Villa",
//         description : "By the beach",
//         price : 1200,
//         location : "Calungute Goa",
//         country : "India"
//     });
//     await sampleListing.save();
    
//     res.send("Sucessfully saved database & Testing");
// })



app.all(/.*/ , (req , res ,next)=>{
  next(new ExpressError(404 , "Page not found"));
});


//-----------------ERROR HANDLER-------------------

app.use((err , req, res, next)=>{
    let {statusCode=500 , message="Something went wrong"} = err;
    res.status(statusCode).render('error.ejs' , {message , err});
    // res.status(statusCode).send(message);

});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening to port : ${PORT}`);
});
