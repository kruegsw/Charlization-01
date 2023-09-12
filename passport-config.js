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
      // hash of user provided password must match the stored hash of the password in the database
      if (await bcrypt.compare(password, user.password)) {
        // if match return user
        return done(null, user)
      } else {
        // if not match, don't return user, send error message (which will be displayed to user via flash)
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

passport.use(new LocalStrategy({ /*usernameField: 'email'*/ }, authenticateUser))

  //passport.serializeUser((user, done) => done(null, user.id))    <-- used to say this, still works when returning 'user' rather than 'user.id'
  passport.serializeUser((user, done) => done(null, user)) // returns 'user' to passport, which is accessible via 'req.session.passport.user'
  passport.deserializeUser((id, done) => done(null, getUserById(id)))
}

module.exports = initialize