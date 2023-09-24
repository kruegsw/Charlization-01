//require('dotenv').config()

const express = require("express")
const logger = require("../logger")
const router = express.Router()
//const passport = require('passport')
const Game = require("../models/Game")
const User = require("../models/User")

router.get("/", async (req, res) => {
    
    const games = await Game.find({ createdBy: req.session.passport.user })
    const allGames = await Game.find()
    res.render("games/index.ejs", { username: req.session.passport.user, games: games, allGames: allGames })

    //res.render('about.ejs', { username: req.session.passport.user })

    //const user = await User.findById(req.session.passport.user)
    //const games = await Game.find({ createdBy: user._id })
    //console.log(user)
    //console.log(user._id)
    //console.log(games)
    //res.render("games/index.ejs", { username: JSON.stringify(user) })
})

router.get('/new', (req, res) => {
    res.render('games/new.ejs', { username: req.session.passport.user })
})

router.post('/new', async (req, res) => {
    logger.info("app.post /games/new middleware")
    try {
        const game = new Game({ gameName: req.body.gameName, createdBy: req.session.passport.user })
        //const user = await User.findById(req.session.passport.user)
        //const game = new Game({ gameName: req.body.gameName, createdBy: user._id })
        await game.save()   
        res.redirect('/games')
    } catch (e) {
        logger.error( "error: " + e )
        res.redirect('/games/new')
    }
})
/*
router.post('/:id/:gameState', async (req, res) => {
    const game = await Game.findOne({ _id: req.params.id })
    game.update({gameState:req.params.gameState}, function (err, result) {
        if (err){
            console.log(err)
        }else{
            console.log("Result :", result) 
        }
    });
})
*/

router.get('/:id', async (req, res) => {
    const game = await Game.findOne({ _id: req.params.id })
    logger.info(`${req.session.passport.user} has entered game ${req.params.id}, the req.session is: ${JSON.stringify(req.session, null, 4)}`)
    res.render("games/play.ejs", {
        //username: req.session.passport.user,
        game: game,
        socketURL: process.env.SOCKET_IO_URL
    })
})

module.exports = router

