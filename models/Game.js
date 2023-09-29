const mongoose = require('mongoose')
//const User = require("../models/User")

const playerSchema = new mongoose.Schema({
    username: String,
    symbol: String
})

const gameSchema = new mongoose.Schema({
    gameName: String,
    gameState: {
        type: Array,
        default: Array.from({ length: 3 }, () => Array(3).fill(''))
    },
    chatLog: {
        type: Array,
        author: String,
        message: String,
    },
    createdBy: String,
    players: [playerSchema],
    createdAt: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    updatedAt: {
        type: Date,
        default: () => Date.now()
    }
})


gameSchema.pre('save', function(next) {
    this.updatedAt = Date.now()
    //console.log("gameSchema pre middle ware ran")
    next()
})

gameSchema.post('save', function(doc, next) {
    //console.log("gameSchema post middle ware ran")
    next()
})

module.exports = mongoose.model("Game", gameSchema)