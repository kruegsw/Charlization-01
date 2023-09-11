require('dotenv').config()

const express = require('express')
const logger = require("./logger")

const mongoose = require('mongoose')
const User = require("./models/User")

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true
})
const db = mongoose.connection
db.on('error', (error) => logger.error(error))
db.once('open', () => logger.info('Connected to Database'))



run()
async function run() {
    try {
        //const user = await User.findById("64d2f0ee639bfd0b0a1527d5")
        //const user = await User.find({ name: "Kyle" })
        //const user = await User.findByName("Kyle")
        //const user = await User.findOne({ username: "w" })
        //console.log(user.username === "w")
        //await user.save()
        /*
        const user = await User.where("age")
            .gt(12)
            .where("name")
            .equals("Kyle")
            .populate("bestFriend")
            .limit(1)
            //.select("age")
        */

        //user[0].bestFriend = "64d354f571c67ee0468646f6"
        //await user[0].save()
        //console.log(user)
        //console.log(user.nameAge)
        //user.sayHi()
    /*
        const user = await User.create({
            name: "Kyle",
            age: 26,
            hobbies: ["Weight lifting", "Bowling"],
            address: {
                street: "Main St"
            },
            email: "test@test.com"
        })
        user.createdAt = 5
        await user.save()
        //const user = new User({ name: "Kyle", age: 26 })
        //user.save().then(() => console.log("User Saved"))
        //await user.save()
        console.log(user)
    */
    } catch (e) {
        logger.error(e.message)
    }
}


//const routes = require("./routes")

// Init App
const app = express()

const bcrypt = require('bcrypt')
const passport = require('passport')
const flash = require('express-flash')
const session = require('express-session')
//const methodOverride = require('method-override')
const MongoStore = require('connect-mongo');

app.use(express.static("public"))
//app.use(express.urlencoded({ extended: true }))
//app.use(express.json()) // this allows parsing JSON from the body

const initializePassport = require('./passport-config')
initializePassport(
    passport,
    username => User.findOne({ username: username }),
    (user, id) => user.id === id 
)

//app.set('views', path.join(__dirname, 'views'));
app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))
//app.use("/", routes)
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({
        mongoUrl: db.client.s.url,
        ttl: 14 * 24 * 60 * 60 // = 14 days. Default
    })
}))

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

//const connections = require("./connections/socketio")
//connections()

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

app.post('/register', checkNotAuthenticated, async (req, res) => {
    logger.info("app.post /register middleware")
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)

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

const userRouter = require('./routes/users')
const gameRouter = require('./routes/games')
app.use('/users', checkAuthenticated, userRouter)
app.use('/games', checkAuthenticated, gameRouter)


const { createServer } = require("http");
const { Server } = require("socket.io");

const httpServer = createServer(app);

const io = new Server(httpServer, { /* options */ });

io.on('connection', (socket) => {
    logger.info(`Client ${socket.id} connected to the WebSocket`); // id randomly assigned to client

    socket.on('disconnect', () => {
        logger.info(`Client  ${socket.id} disconnected`);
    });

    socket.on('chat message', function(msg) {
        logger.info("Received a chat message");
        io.emit('chat message', msg);
    });
    
})

httpServer.listen(3000);

/*
var httpServer = require('http').createServer(app);
var io = require('socket.io')(httpServer);

httpServer.listen(process.env.PORT || 3000, function() {
    var host = httpServer.address().address
    var port = httpServer.address().port
    console.log('App listening at http://%s:%s', host, port)
});

io.on('connection', (socket) => {
    console.log(`Client ${socket.id} connected to the WebSocket`); // id randomly assigned to client

    socket.on('disconnect', () => {
        console.log(`Client  ${socket.id} disconnected`);
    });

    socket.on('chat message', function(msg) {
        console.log("Received a chat message");
        io.emit('chat message', msg);
    });
    
})

//httpServer.listen(3000)
*/