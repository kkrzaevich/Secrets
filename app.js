//jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');
mongoose.set('strictQuery', true);
mongoose.connect(`mongodb+srv://${process.env.DB_LOGIN}:${process.env.DB_PASSWORD}@cluster76232.ammm8wy.mongodb.net/userDB`);

const userSchema = new mongoose.Schema({ email: String, password: String });

// Encryption
const secret = process.env.ENCRYPTION_STRING;
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

const User = mongoose.model('User', userSchema);


app.get('/', function(req,res) {
    res.render('home');
});
app.get('/login', function(req,res) {
    res.render('login');
});
app.get('/register', function(req,res) {
    res.render('register');
});

app.post('/register', function(req,res) {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        let newUserLogin = req.body.username;
        let newUserPassword = hash;
        const newUser = new User({ email: newUserLogin, password: newUserPassword });
        newUser.save();
        res.render('secrets');
    });
    
});

app.post('/login', function(req,res) {
    let existingUserLogin = req.body.username;
    let existingUserPassword = req.body.password;
    User.findOne({email: existingUserLogin}, function (err, foundUser) {
        bcrypt.compare(existingUserPassword, foundUser.password, function(err, result) {
            if (result) {
                res.render('secrets');
            } else {
                res.send('Invalid email or password :(')
            }
        })
        
        // if (existingUserPassword === foundUser.password) {
        //     res.render('secrets');
        // } else {
        //     res.send('Invalid email or password :(')
        // }
    })
})





app.listen(3000, function(req) {
    console.log("Server started on port 3000");
  });