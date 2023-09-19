// sensitive data
require('dotenv').config()
const logger = require("./logger")

//-----------------------------------------------------------------
//----------------CONFIGURE AND INITIALIZE MONGODB.................
//-----------------------------------------------------------------

const mongoose = require('mongoose')

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true
})
const db = mongoose.connection
db.on('error', (error) => logger.error(error))
db.once('open', () => logger.info('Connected to Database'))

//-----------------------------------------------------------------
//----------------INITIATE EXPRESS APP.............................
//-----------------------------------------------------------------

const express = require('express')
const app = express()

//-----------------------------------------------------------------
//-------------AUTHENTICATION AND SESSION..........................
//-----------------------------------------------------------------

const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
//const methodOverride = require('method-override')
const MongoStore = require('connect-mongo');
const User = require("./models/User")

app.use(express.static("public"))
//app.use(express.urlencoded({ extended: true }))
//app.use(express.json()) // this allows parsing JSON from the body

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    username => User.findOne({ username: username }),
    (user, id) => user.id === id 
)

app.use(flash())

const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongoUrl: db.client.s.url,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
})

app.use(sessionMiddleware)

//console.log(db)
//console.log(db.client)
//console.log(db.client.s)
//console.log(db.client.s.url)

// Express Messages Middleware
//app.use(require('connect-flash')());
//app.use(function (req, res, next) {
//  res.locals.messages = require('express-messages')(req, res);
//  next();
//});

app.use(passport.initialize())
app.use(passport.session())
//app.use(methodOverride('_method'))

// define authentication middleware
function checkAuthenticated(req, res, next) {
    logger.info("checkAuthenticated middleware")
    logger.info(`req/isAuthenticated() is ${req.isAuthenticated()}`)
    if (req.isAuthenticated()) {
        return next()
    }

    res.redirect('/login')
}

function checkNotAuthenticated(req, res, next) {
    logger.info("checkNotAuthenticated middleware")
    if (req.isAuthenticated()) {
        return res.redirect('/')
    }
    next()
}

//-----------------------------------------------------------------
//------------------MAIN ROUTES....................................
//-----------------------------------------------------------------


//app.set('views', path.join(__dirname, 'views'));
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
//app.use("/", routes)

app.get('/', checkAuthenticated, (req, res) => {
    logger.info("app.get / middleware")
    logger.info("req.user: " + JSON.stringify(req.user))
    logger.info("req.session.passport.user: " + req.session.passport.user )
    res.render('index.ejs', { username: req.session.passport.user.username })
    //console.log(req)
})

app.get('/about', checkAuthenticated, (req, res) => {
    res.render('about.ejs', { username: req.session.passport.user.username })
})

app.get('/login', checkNotAuthenticated, (req, res) => {
    logger.info("app.get /login middleware")
    res.render('login.ejs')
})

app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true // enables error text to appear where specified on ejs files (I am not sure how this works)
}))

app.get('/register', checkNotAuthenticated, (req, res) => {
    logger.info("app.get /register middleware")
    res.render('register.ejs')
})

const bcrypt = require('bcrypt')

app.post('/register', checkNotAuthenticated, async (req, res) => {
    logger.info("app.post /register middleware")
    try {
        // a hashed version of the user provided password will be stored in the database
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

        // 
        const user = new User({ username: req.body.username, password: hashedPassword })
        await user.save()

        /*
        users.push({
        id: Date.now().toString(),
        username: req.body.username,
        password: hashedPassword
        })
        console.log(users)
        */


        res.redirect('/login')
    } catch (e) {
        logger.error( "error: " + e )
        res.redirect('/register')
    }
})

/*
app.delete('/logout', (req, res, next) => {
req.logOut(function(err) {
    //if (err) { return next(err); }
    res.redirect('/');
    });
res.redirect('/login')
})
*/

app.post('/logout', function(req, res, next) {
    logger.info("app.post /logout middleware")
    req.logout(function(err) {
        if (err) { return next(err); }
        //req.flash('success', 'You are logged out');
        res.redirect('/');
    });
});

//-----------------------------------------------------------------
//---------------REGISTER ROUTERS..................................
//-----------------------------------------------------------------

const userRouter = require('./routes/users')
const gameRouter = require('./routes/games')
app.use('/users', checkAuthenticated, userRouter)
app.use('/games', checkAuthenticated, gameRouter)

// for testing of passing game state below...
const Game = require("./models/Game")

//-----------------------------------------------------------------
//------------------SOCKET.IO......................................
//-----------------------------------------------------------------

// for handing sessionID from express app to socket
// https://www.danielbaulig.de/socket-ioexpress/index.html

const { createServer } = require("http");
const { Server } = require("socket.io");

// wrap express app in http server, http server is required for websocket connection 
const httpServer = createServer(app);
const io = new Server(httpServer, { /* options */ });
 // trasports options must be specified for mobile browser, see:
// https://stackoverflow.com/questions/23946683/socket-io-bad-request-with-response-code0-messagetransport-unknown

//const connections = require("./connections/socketio")
//connections()

io.engine.use(sessionMiddleware);


/*

io.use( (socket, next) => {
    //console.log(socket)
    if (socket.handshake.auth.token) {
        socket.username =  socket.handshake.auth.token //getUsernameFromToken(socket.handshake.auth.token)
        next()
    } else {
        //next()
        next(new Error("Please send token"))
    }
})

*/

io.on('connection', (socket) => {

    // https://socket.io/how-to/use-with-express-session
    // I believe this is reloading the sessionMiddleWare i.e. io.engine.use(sessionMiddleware);
    socket.use((__, next) => {
        socket.request.session.reload((err) => {
        if (err) {
          socket.disconnect();
        } else {
          next();
        }
      });
    });

    // use the session ID to make the link between Express and Socket.IO
    const session = socket.request.session
    const user = session.passport.user

    // the session ID is used as a room
    socket.join(session.id);

    io.engine.use((req, res, next) => {
        //console.log(`req is ${JSON.stringify(req.rawHeaders, null, 4)}`)
        //console.log(`req.sessionID = ${req.sessionID}`)
        //console.log(`socket.request.session is ${JSON.stringify(socket.request.session, null, 4)}`)
        //console.log(`socket.request.session.id is ${JSON.stringify(socket.request.session.id, null, 4)}`)
        //console.log(`session.passport.username is ${session.passport.user.username}`)
        //console.log(`socket.request === req is ${socket.request === req}`)
        //console.log(`socket.request is ${JSON.stringify(socket.request, null, 4)}`)
        //console.log(`socket.request is ${JSON.stringify(socket.request, null, 4)}`)
        next();
    });
    
    logger.info(`Client ${socket.id} connected to the WebSocket`); // id randomly assigned to client

    socket.on('disconnect', () => {
        logger.info(`Client  ${socket.id} disconnected`);
    });

    socket.on('join-game', async (room, callback) => {
        //logger.info("room is: " + room)
        socket.join(room)
        const game = await Game.findOne({ _id: room })
        callback(game.gameState)
        logger.info(`Client (username: ${user.username}, socket.id = ${socket.id}) connected to the room ${room} at ${Date(Date.now())}`) // id randomly assigned to client

        ///////////////////////////////////////////////////// clean this up, move to separate event?
        //let roomClientsSet = io.sockets.adapter.rooms.get(room)
        //let roomClients = Array.from(roomClientsSet).join(',')
        //cb(roomClients) // list of all clients connected to room
        //console.log(roomClients)
        ///////////////////////////////////////////////////// clean this up, move to separate event?
    })

    socket.on('send-message', (message, room) => {
        //console.log(`the message is ${JSON.stringify(message, null, 4)}`)
        logger.info(`Received a chat message from ${user.username} to room ${room}:  ${message}`);

        if (room === "") {
            io.emit('receive-message', {author: user.username, text: message} )
        } else {
            io.in(room).emit('receive-message', {author: user.username, text: message} )
            updateGameState(gameId = room, {author: user.username, text: message} )
        }
    });
    
})

//-----------------------------------------------------------------
//------------------Functions for Socket I... belong here?.........
//-----------------------------------------------------------------

async function updateGameState (gameId, message) {
    const game = await Game.findOne({ _id: gameId })
    game.gameState.push(message)
    game.save()
}

//-----------------------------------------------------------------
//------------------START SERVER...................................
//-----------------------------------------------------------------

httpServer.listen(3000);
