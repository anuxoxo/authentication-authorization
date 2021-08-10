//jshint esversion:6
require('dotenv').config()
const express = require('express');
const md5 = require('md5');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', userSchema);

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.render('home');
});

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {

        const { email, password } = req.body;

        const newUser = new User({
            email: email,
            password: md5(password),
        });

        newUser.save((err) => {
            if (err) {
                console.log(err);
            }
            else {
                res.render('secrets');
            }
        })
    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {

        const { email, password } = req.body;

        User.findOne({ email: email }, (err, foundUser) => {
            if (err) {
                console.log(err);
            } else {
                if (foundUser.password === md5(password)) {
                    res.render('secrets');
                }
            }
        })
    })



// app.get('/submit', (req, res) => {
//     res.render('submit');
// });


app.listen(PORT, () => console.log(`Server running at port ${PORT}: http://localhost:${PORT}/`))