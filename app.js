//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require( 'passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const sessionSecret = process.env.SESSION_SECRET;

app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));


const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://${process.env.DB_LOGIN}:${process.env.DB_PASSWORD}@cluster76232.ammm8wy.mongodb.net/userDB`);

const userSchema = new mongoose.Schema({ email: String, password: String, googleId: String, secret: String });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

app.get('/', function(req,res) {
    res.render('home');
});
app.get('/login', function(req,res) {
    res.render('login');
});
app.get('/register', function(req,res) {
    res.render('register');
});
app.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });
app.get('/secrets', function(req,res){
    if (req.isAuthenticated()) {
        User.find({secret: {$exists: true}}, function (err, foundUsers) {
          let submittedSecrets = [];
          for (let i=0; i<foundUsers.length; i++) {
            submittedSecrets[i] = foundUsers[i].secret;
          }
          res.render('secrets', {randomSecret: submittedSecrets[Math.floor(Math.random()*submittedSecrets.length)]});
        })
    } else {
        res.redirect('/login');
    }
});
app.get('/submit', function(req,res){
  if (req.isAuthenticated()) {
      res.render('submit');
  } else {
      res.redirect('/login');
  }
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.post('/register', function(req,res) {
    User.register({username: req.body.username}, req.body.password, function(err,user) {
        if (err) {
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }
    })
    
});

app.post('/login', function(req,res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, (err) => {
        if (err) {
            console.log(err);
            res.redirect('/login');
        } else {
            passport.authenticate("local")(req,res,function(){
                res.redirect('/secrets');
            });
        }
    })
})

app.post('/submit', function(req,res) {
  const newSecret = req.body.secret;
  const userId = req.user.id;
  User.findByIdAndUpdate(userId, { secret: newSecret },
  function (err, docs) {
    if (err){
    console.log(err)
    } else{
    res.redirect('/secrets')
  }
  })
})




app.listen(3000, function(req) {
    console.log("Server started on port 3000");
  });