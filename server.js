// server.js

// set up ======================================================================
// get all the tools we need
let express = require('express')
let app = express()
let port = process.env.PORT || 8080
let mongoose = require('mongoose')
let passport = require('passport')
let flash = require('connect-flash')

let morgan = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')
let session = require('express-session')

let configDB = require('./config/database.js')
let then = require('express-then')
let lodash = require('lodash')


// configuration ===============================================================
mongoose.connect(configDB.url) // connect to our database

require('./config/passport')(passport) // pass passport for configuration

// set up our express application
app.use(morgan('dev')) // log every request to the console
app.use(cookieParser()) // read cookies (needed for auth)
app.use(bodyParser.json()) // get information from html forms
app.use(bodyParser.urlencoded({extended: true}))

app.set('view engine', 'ejs') // set up ejs for templating

// required for passport// required for passport
app.use(session({
    secret: 'ilovethenodejs',
    resave: true,
    saveUninitialized: true
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash()) // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport)

// launch ======================================================================
app.listen(port)

console.log('The magic happens on port ' + port)
