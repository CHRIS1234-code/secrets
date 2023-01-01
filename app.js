//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const mongodb = require("mongodb");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRound = 10
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
const FacebookStrategy = require("passport-facebook");





const app = express();



app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: true}));

app.use(session({
    secret: "Our Little Secret.",
    resave: false,
    saveUninitialized: false,
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://CHRISosei:user12345@userssecrets.a6puxgy.mongodb.net/userDB")

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // callbackURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ username: profile.emails[0].value,  googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res)=>{
    res.render('home')
});

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile", "email"] })
  );

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

  app.get('/auth/facebook',
  passport.authenticate('facebook'));

  app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect SECRETS.
    res.redirect('/secrets');
  });


app.get("/login", (req, res)=>{
    res.render('login')
});

app.get("/register", (req, res)=>{
    res.render('register')
});

app.get("/secrets", (req, res) => {
   User.find({"secret": {$ne: null}}, function (err, foundUsers) {
    if (err) {
        console.log(err);
    } else {
        if (foundUsers) {
            res.render("secrets", {userWithSecrets: foundUsers})
        }
    }
   })
});


app.get("/logout", (req, res) => {
    req.logOut(function (err) {
        if (err){
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});


app.get("/submit", (req,res) => {
    if (req.isAuthenticated()) {
        res.render("submit")
    } else {
        res.redirect("/login")
    }
});

app.post("/submit", function(req,res) {

    console.log(req.user.id);

    User.findById(req.user.id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = req.body.secretText;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});



app.post("/register", (req, res) => {
    User.register({username: req.body.username}, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });
});


app.post("/login", function(req, res) {
   const user = new User ({
    username: req.body.username,
    password: req.body.password
   }) 

   req.login(user, function (err) {
    if (err) {
        console.log(err);
    } else {
        passport.authenticate("local") (req, res, function () {
            res.redirect("/secrets");
        });
    }
   })
});





const PORT = 3000

app.listen(PORT, ()=>{
    console.log(`app started at port: http://localhost:${PORT}`);
})