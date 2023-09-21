const express = require("express")
const logger = require("../logger")
const router = express.Router()
const passport = require('passport')

router.get('/', checkAuthenticated, (req, res) => {
    logger.info("app.get / middleware")
    logger.info("req.user: " + JSON.stringify(req.user))
    logger.info("req.session.passport.user: " + req.session.passport.user )
    res.render('index.ejs', { username: req.session.passport.user.username })
    //console.log(req)
})

router.get('/about', checkAuthenticated, (req, res) => {
    res.render('about.ejs', { username: req.session.passport.user.username })
})

router.get('/login', checkNotAuthenticated, (req, res) => {
    logger.info("app.get /login middleware")
    res.render('login.ejs')
})

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true // enables error text to appear where specified on ejs files (I am not sure how this works)
}))

router.get('/register', checkNotAuthenticated, (req, res) => {
    logger.info("app.get /register middleware")
    res.render('register.ejs')
})

const bcrypt = require('bcrypt')

router.post('/register', checkNotAuthenticated, async (req, res) => {
    logger.info("app.post /register middleware")
    try {
        // a hashed version of the user provided password will be stored in the database
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const user = new User({ username: req.body.username, password: hashedPassword })
        await user.save()

        res.redirect('/login')
    } catch (e) {
        logger.error( "error: " + e )
        res.redirect('/register')
    }
})

router.post('/logout', function(req, res, next) {
    logger.info("app.post /logout middleware")
    req.logout(function(err) {
        if (err) { return next(err); }
        //req.flash('success', 'You are logged out');
        res.redirect('/');
    });
});

router.get('/', checkAuthenticated, (req, res) => {
    logger.info("router.get / middleware")
    //res.send("User List")
    res.render('index.ejs', { username: req.user.username })
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    logger.info("checkNotAuthenticated middleware")
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

module.exports = router

