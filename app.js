//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyparser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");
const encrypt = require("mongoose-encryption");




const app = express();



app.set('view engine', 'ejs');
app.use(express.static("public"));
app.use(bodyparser.urlencoded({extended: true}));


mongoose.connect("mongodb://localhost:27017/userDB ")

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});



userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] }); 

const User = new mongoose.model("User", userSchema);

app.get("/", (req, res)=>{
    res.render('home')
});

app.get("/login", (req, res)=>{
    res.render('login')
});

app.get("/register", (req, res)=>{
    res.render('register')
});

app.post("/register", (req, res) => {
    const newUser = new User ({
            email: req.body.username,
            password: req.body.password
        });
        newUser.save(function (err) {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets")
            }
        });
});


app.post("/login", function(req, res) {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
    });
});





const PORT = 3000

app.listen(PORT, ()=>{
    console.log(`app started at port: http://localhost:${PORT}`);
})