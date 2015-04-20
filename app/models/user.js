var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: false,
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function() {
    this.on('creating', function(model, attrs, options){
      var salt = bcrypt.genSaltSync();
      var pw = model.get('password');
      var hashedpw = bcrypt.hashSync(pw, salt);
      console.log(salt, pw, hashedpw);
      model.set('salt', salt);
      model.set('password', hashedpw);
    });
  },
  checkPassword: function(password) {
    console.log("CHECK PASSWORD ##############################################################");
    console.log("password", this.get('password'));
    console.log("salt", this.get('salt'));
    console.log(bcrypt.hashSync(password, this.get('salt')));
    return this.get('password') === bcrypt.hashSync(password, this.get('salt'));
  }
});

module.exports = User;
