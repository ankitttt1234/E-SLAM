require('dotenv').config();
const express = require('express')
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");
const session = require('express-session');
const bodyParser = require('body-parser');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook");
const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  })); 

app.use(passport.initialize());
app.use(passport.session());

const tempUrl='mongodb://localhost:27017/Slam';
const findOrCreate = require('mongoose-findorcreate')
const url='mongodb+srv://admin:Ankit@123@cluster0-rxkgi.mongodb.net/Slam?retryWrites=true&w=majority';


mongoose.connect(url,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


const userSchema = new mongoose.Schema({
    username:String,
    password:String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model('User',userSchema);


passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
	done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user) {
	  done(err, user);
	});
  });


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:5000/payment",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
    User.findOrCreate({ username: profile.emails[0].value }, function (err, user) { 
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:5000/payment-f",
     profileFields: ['id', 'displayName', 'photos', 'email']
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile)
    User.findOrCreate({username: profile.emails[0].value}, function (err, user) { 
      return cb(err, user);
    });
  }
));


 
//user.save();
require('./routes')(app)

app.get("/",function(req,res){
    res.render("index")
})

app.post("/log-in",function(req,res){
    User.findOne({email:req.body.email, password:req.body.password},function(err,user){
        if(err){
            res.send("Please Register")
        }else if(user===null){
            res.send("Incorrect emailId or password")
        }
        else{
        console.log(user)
        res.redirect("/payment");
        }
    })
    
})
app.get("/pdf",function(req,res){
    res.send("Pdf page");
})

app.get("/sign-up",function(req,res){
    res.render('signUp')
})
app.get("/log-in",function(req,res){
    res.render("logIn")
})
 


app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile','email'] }));




app.get('/payment', 
  passport.authenticate('google', { failureRedirect: '/log-in' }),
  function(req, res) {
    
    res.render("payment")
  });

  
  app.get('/payment-f', 
  passport.authenticate('facebook', { failureRedirect: '/log-in' }),
  function(req, res) {
    
    res.render("payment")
  });



app.get('/auth/facebook',
  passport.authenticate('facebook',{ scope: ['email']}));

  

  let port=process.env.PORT;

  if(port==null || port==""){
    port=5000;
  }
  console.log(port);
  app.listen(port, () => console.log(`Server started on port ${port}`));