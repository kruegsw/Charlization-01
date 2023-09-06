const express = require("express")
const router = express.Router()
//const passport = require('passport')
const Game = require("../models/Game")
const User = require("../models/User")

router.get("/", async (req, res) => {
    //const user = await User.findById(req.session.passport.user)
    //const games = await Game.find({ createdBy: user._id })
    const games = await Game.find({ createdBy: req.session.passport.user })
    //console.log(user)
    //console.log(user._id)
    console.log(games)
    res.render("games/index.ejs", { username: req.session.passport.user.username, games: games })
    //res.render("games/index.ejs", { username: JSON.stringify(user) })
})

router.get('/new', (req, res) => {
    res.render('games/new.ejs', { username: req.session.passport.user.username })
})

router.post('/new', async (req, res) => {
    console.log("app.post /games/new middleware")
    try {
        const user = await User.findById(req.session.passport.user)
        const game = new Game({ gameName: req.body.gameName, createdBy: user._id })
        await game.save()   
        res.redirect('/games')
    } catch (e) {
        console.log( "error: " + e )
        res.redirect('/games/new')
    }
})

router.get('/:id', async (req, res) => {
    const game = await Game.findOne({ _id: req.params.id })
    res.render("games/play.ejs", { username: req.session.passport.user.username, game: game })
})

module.exports = router

