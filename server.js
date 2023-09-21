require('dotenv').config() // sensitive data

const express = require('express')
const { Server } = require("socket.io");
const { createServer } = require("http")
const passport = require('passport')
const session = require('express-session')
const flash = require('express-flash')
const mongoose = require('mongoose')
const MongoStore = require('connect-mongo');

const logger = require("./logger")
const User = require("./models/User")
const initializePassport = require('./passport-config')
const mainRouter = require('./routes/main')
const userRouter = require('./routes/users') // not currently used for anything
const gameRouter = require('./routes/games')

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true })
const db = mongoose.connection
db.on('error', (error) => logger.error(error))
db.once('open', () => logger.info('Connected to Database'))
const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongoUrl: db.client.s.url,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
})

const app = express()
app.set('view-engine', 'ejs')
app.use(sessionMiddleware)
initializePassport(passport, username => User.findOne({ username: username }), (user, id) => user.id === id )
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }))
app.use('/', mainRouter)
app.use('/users', checkAuthenticated, userRouter)
app.use('/games', checkAuthenticated, gameRouter)

const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });

const initializeSocketIO = require("./connections/socketio")
initializeSocketIO(io)
io.engine.use(sessionMiddleware);

function checkAuthenticated(req, res, next) {
    logger.info("checkAuthenticated middleware")
    logger.info(`req/isAuthenticated() is ${req.isAuthenticated()}`)
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

httpServer.listen(3000);
