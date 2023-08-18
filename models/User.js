const mongoose = require('mongoose')

//const Schema = mongoose.Schema;
//const passportLocalMongoose = require('passport-local-mongoose');

//const User = new Schema({});

//module.exports = mongoose.model('User', User);

/*
const addressSchema = new mongoose.Schema({
    street: String,
    city: String
})
*/

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
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


//userSchema.plugin(passportLocalMongoose);

/*
userSchema.methods.sayHi = function() {
    console.log(`Hi my name is ${this.name}`)
}

userSchema.statics.findByName = function (name) {
    return this.find({ name: new RegExp(name, 'i') })
}

userSchema.query.byName = function (name) {
    return this.where({ name: new RegExp(name, 'i') })
}

userSchema.virtual('nameAge').get(function() {
    return `${this.name} <${this.age}>`
})

*/

userSchema.pre('save', function(next) {
    this.updatedAt = Date.now()
    console.log("mongoose pre middle ware ran")
    next()
})

userSchema.post('save', function(doc, next) {
    //doc.sayHi(),
    console.log("mongoose post middle ware ran")
    next()
})

module.exports = mongoose.model("User", userSchema)