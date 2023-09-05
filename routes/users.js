const express = require("express")
const router = express.Router()
const passport = require('passport')
const User = require("../models/User")

router.get('/', checkAuthenticated, (req, res) => {
    console.log("router.get / middleware")
    //res.send("User List")
    res.render('index.ejs', { username: req.user.username })
})

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/login');
}

module.exports = router
