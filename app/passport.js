var local = require('passport-local').Strategy;
var User = require('./models/user.js');

module.exports = function(passport) {
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    new User({ id: id }).fetch().then(function(model) {
      done(null, model);
    });
  });

  passport.use('local-signup', new local({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done) {
    console.log("sign up");
    new User({username: username, password: password}).save().then(function(model)
      {
        console.log("sign up2");
        done(null, model);
      });
  }));

  passport.use('local-login', new local({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done){
      new User({username: req.body.username}).fetch()
    .then(function(model) {
      if(model && model.checkPassword(req.body.password)) {
        done(null, model);
      } else {
        done(null, false);
      }
    })
  }))
}
