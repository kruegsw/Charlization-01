const mongoose = require('mongoose')
//const User = require("../models/User")

const gameSchema = new mongoose.Schema({
    gameName: String,
    gameState: {
        type: Array,
        author: String,
        message: String,
    },
    createdBy: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: "User" // reference to user model
    },
    players: String,
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
    console.log("gameSchema pre middle ware ran")
    next()
})

gameSchema.post('save', function(doc, next) {
    console.log("gameSchema post middle ware ran")
    next()
})

module.exports = mongoose.model("Game", gameSchema)