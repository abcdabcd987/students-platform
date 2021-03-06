var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var moment = require('moment');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);

var config = require('./config');
var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.locals.moment = moment;
app.locals.ROOT = config.root;

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(session({
    secret: config.sessionSecret,
    store: new pgSession({
        // $ psql mydatabase < node_modules/connect-pg-simple/table.sql
        conString : `postgres://${config.database.username}:${config.database.password}@${config.database.options.host}/${config.database.database}`
    }),
    resave: true,
    saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(`${config.root}`, express.static(path.join(__dirname, 'public')));
app.use(`${config.root}vendor`, express.static(path.join(__dirname, 'bower_components')));

app.use(`${config.root}`, routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      session: req.session
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    session: req.session
  });
});


module.exports = app;
