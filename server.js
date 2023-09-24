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
const authRouter = require('./routes/auth')
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
initializePassport(passport, user => User.findOne({ username: user }), (user, id) => user.id === id )
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
//app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }))
app.use('/auth', checkNotAuthenticated, authRouter)
app.use('/', checkAuthenticated, mainRouter)
app.use('/users', checkAuthenticated, userRouter)
app.use('/games', checkAuthenticated, gameRouter)

const httpServer = createServer(app);
//const io = new Server(httpServer, { /* options */ });
const io = new Server(httpServer, {'transports': ['websocket', 'polling']}); // https://stackoverflow.com/questions/23946683/socket-io-bad-request-with-response-code0-messagetransport-unknown


const initializeSocketIO = require("./connections/socketio")
initializeSocketIO(io)
io.engine.use(sessionMiddleware);

function checkAuthenticated(req, res, next) {
    //logger.info("checkAuthenticated middleware")
    //logger.info(`req/isAuthenticated() is ${req.isAuthenticated()}`)
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/auth/login')
}

function checkNotAuthenticated(req, res, next) {
    //logger.info("checkNotAuthenticated middleware")
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

httpServer.listen(3000);
