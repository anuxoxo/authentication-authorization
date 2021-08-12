const express = require('express');
const mongoose = require('mongoose');

const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// express-session
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
}));

// passport
app.use(passport.initialize());
app.use(passport.session());

const User = mongoose.model('User');

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile);

        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// API endpoints
app.get('/secrets', (req, res) => {

    if (req.isAuthenticated()) {
        User.find({ secret: { $ne: null } }, (err, foundUsers) => {
            if (err) {
                console.log(err);
            }
            else {
                if (foundUsers)
                    res.render("secrets", { usersWithSecrets: foundUsers });
            }
        })
    } else {
        res.redirect("/login");
    }
})

app.get('/logout', (req, res) => {
    req.logOut();
    res.redirect('/');
})

app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/submit", (req, res) => {
    const { secret } = req.body;
    console.log(req.user.id);

    User.findById(req.user.id, (err, foundUser) => {
        if (err) {
            console.log(err);
        } else {
            if (foundUser) {
                foundUser.secret = secret;
                foundUser.save(() => {
                    res.redirect('/secrets');
                });
            }
        }
    })
})

app.get('/', (req, res) => {
    res.render('home');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        res.redirect('/secrets');
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

module.exports = app;