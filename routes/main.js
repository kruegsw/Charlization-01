const express = require("express")
const logger = require("../logger")
const router = express.Router()
const passport = require('passport')

router.get('/', (req, res) => {
    //logger.info("app.get / middleware")
    //logger.info("req.user: " + JSON.stringify(req.user))
    //logger.info("req.session.passport.user: " + req.session.passport.user )
    //logger.info(`req.session: ${JSON.stringify(req.session, null, 4)}`)
    res.render('index.ejs', { username: req.session.passport.user })
    //console.log(req)
})

router.get('/', function(req, res) {
    res.render('index.ejs');
});

router.get('/canvas1', (req, res) => {
    res.render('canvas1.html')
})

router.get('/about', (req, res) => {
    res.render('about.ejs', { username: req.session.passport.user })
})

router.post('/logout', function(req, res, next) {
    //logger.info("app.post /logout middleware")
    req.logout(function(err) {
        if (err) { return next(err); }
        //req.flash('success', 'You are logged out');
        res.redirect('/');
    });
});

module.exports = router

