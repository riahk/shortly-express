var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var User = require('./app/models/user');

var app = express();

app.use(session({secret: 'cool'}));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/signup',
function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res)
{
  console.log("post");
  console.log(req.body);
  var user = new User({
    username : req.body.username,
    password : req.body.password
  });

  user.save().then(function()
  {
    req.session.regenerate(function() {
      req.session.user = user.get('id');
      res.redirect(302, "/");
    });
  });
});

app.get('/login',
function(req, res) {
  console.log("login");
  res.render('login');
});

app.post('/login', function(req, res) {
  console.log('logging in................................');
  console.log(req.body);
  new User({username: req.body.username}).fetch()
    .then(function(model) {
      if(model && model.checkPassword(req.body.password)) {
        console.log("got password");
        req.session.regenerate(function() {
          console.log("regenerated session");
          req.session.user = model.get('id');
          res.redirect(302, "/");
        });
      } else {
        console.log("UNAUTHORIZED");
        res.redirect(302, '/login');
      }
    })

});

var restrict = function(req, res, next) {
  console.log("redirect /");
  //check if logged in
  if(req.session.user) {
    next();
  } else { res.redirect(302, '/login'); }
  //if logged in, next()
  //else redirect to /login
}


app.get('/', restrict,
function(req, res) {
  res.render('index');
});

app.get('/create', restrict,
function(req, res) {
  res.render('index');
});

app.get('/links', restrict,
function(req, res) {
  Links.reset().query({where:{user_id: req.session.user}}).fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;
  var userId = req.session.user;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri, user_id: userId }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin,
          user_id : userId
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      console.log("not link");
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
