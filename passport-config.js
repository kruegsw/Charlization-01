const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

async function initialize(passport, getUserByUsername, getUserById) {
  const authenticateUser = async (username, password, done) => {
    const user = await getUserByUsername(username)
    if (user == null) {
      return done(null, false, { message: 'No user with that username' })
    }

    //console.log("user.username = " + user.username)
    //console.log("user.password = " + user.password)
    //console.log("user.id = " + user.id)
    //console.log("user = " + user)

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

passport.use(new LocalStrategy({ /*usernameField: 'email'*/ }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => done(null, getUserById(id)))
}

module.exports = initialize