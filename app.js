require('dotenv').config()
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

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
    password: String,
    googleId: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

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

    User.find({ secret: { $ne: null } }, (err, foundUsers) => {
        if (err) {
            console.log(err);
        }
        else {
            if (foundUsers)
                res.render("secrets", { usersWithSecrets: foundUsers });
        }
    })

    // if (req.isAuthenticated()) {
    //     res.render("secrets");
    // } else {
    //     res.redirect("/login");
    // }
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



app.listen(PORT, () => console.log(`Server running at port ${PORT}: http://localhost:${PORT}/`))