const express = require("express")
const passport = require('passport')
const bcrypt = require('bcrypt')

const logger = require("../logger")
const User = require("../models/User")

const router = express.Router()

router.get('/login', (req, res) => {
    //logger.info("app.get /login middleware")
    res.render('auth/login.ejs')
})

router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: 'auth/login',
    failureFlash: true // enables error text to appear where specified on ejs files (I am not sure how this works)
}))

router.get('/register', (req, res) => {
    //logger.info("app.get /register middleware")
    res.render('auth/register.ejs')
})

router.post('/register', async (req, res) => {
    //logger.info("app.post /register middleware")
    try {
        // a hashed version of the user provided password will be stored in the database
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        const user = new User({ username: req.body.username, password: hashedPassword })
        await user.save()

        res.redirect('auth/login')
    } catch (e) {
        logger.error( "error: " + e )
        res.redirect('auth/register')
    }
})

module.exports = router

