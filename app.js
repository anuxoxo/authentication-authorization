require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// express-session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));
// passport
app.use(passport.initialize());
app.use(passport.session());

// MongoDB config
mongoose.connect('mongodb://localhost:27017/userDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// API endpoints
app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
})

app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
})

app.get('/', (req, res) => {
    res.render('home');
});

app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {

        const { username, password } = req.body;

        User.register({ username: username, active: false }, password, (err, user) => {
            if (err) {
                console.error(err);
                res.redirect('/register');
            }
            else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/secrets');
                })
            }
        });
    });

app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {

        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, (err) => {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect('/secrets');
                })
            }
        })
    });



app.listen(PORT, () => console.log(`Server running at port ${PORT}: http://localhost:${PORT}/`))