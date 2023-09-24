const logger = require("../logger")
const Game = require("../models/Game")

function initialize (io) {
    io.on('connection', (socket) => {

        // https://socket.io/how-to/use-with-express-session
        // I believe this is reloading the sessionMiddleWare i.e. io.engine.use(sessionMiddleware);
        // in the context of modifying the session

        /*
        socket.use((__, next) => {
            socket.request.session.reload((err) => {
            if (err) {
                logger.error("socket.request.session.reload error " + err)
                socket.disconnect();
            } else {
              next();
            }
          });
        });
        */
    
        // use the session ID to make the link between Express and Socket.IO
        //const session = socket.request.session

        //workaround for safari browser where session.passport is not defined
        /*
        let user = ""
        try {
            user = session.passport.user
          } catch (error) {
            user = "socket.request.session.passport not defined said: "
          }
        
        logger.info(`Client (username: ${user}, socket.id = ${socket.id}) connected to socket at ${Date(Date.now())}.  socket.request.session is ${JSON.stringify(socket.request.session, null, 4)}`)
        */

        // the session ID is used as a room
        //socket.join(session.id);
    
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
            callback(game)
            logger.info(`Client (username: socket.id = ${socket.id}) connected to the room ${room} at ${Date(Date.now())}`) // id randomly assigned to client
            
            //const joinedMessage = `${user} joined chat at ${Date(Date.now())}`
            //io.in(room).emit('receive-message', {author: user, text: joinedMessage} )
            //updateGameState(gameId = room, {author: user, text: joinedMessage} )

            ///////////////////////////////////////////////////// clean this up, move to separate event?
            //let roomClientsSet = io.sockets.adapter.rooms.get(room)
            //let roomClients = Array.from(roomClientsSet).join(',')
            //cb(roomClients) // list of all clients connected to room
            //console.log(roomClients)
            ///////////////////////////////////////////////////// clean this up, move to separate event?
        })
    
        socket.on('send-message', (message, room) => {
            //console.log(`the message is ${JSON.stringify(message, null, 4)}`)
            //logger.info(`Received a chat message from ${message.author} to room ${room}:  ${message.text}`);
            
            if (room === "" && message.type == "chat") {
                io.emit('receive-message', message )
            } else {
                io.in(room).emit('receive-message', message )
                updateGameState(gameId = room, message )
            }
        });
        
    })
    
    async function updateGameState (gameId, message) {
        const game = await Game.findOne({ _id: gameId })
        if (message.type == "chat") { game.chatLog.push({author: message.author, text: message.text}) }
        if (message.type == "move") { game.gameState = message.gameState }
        if (message.type == "addPlayer") { game.players.push(message.player) }
        if (message.type == "removePlayer") {
            if (game.players[1] == message.player) { game.players.pop() } else { game.players.shift() }
        }
        game.save()
    }
}

module.exports = initialize