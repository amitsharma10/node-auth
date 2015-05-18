let Twitter = require("twitter")
let then = require('express-then')

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next()

    res.redirect("/")
}
require("songbird")
let authIDs = require('../config/auth')
module.exports = function (app, passport) {
    function buildTwitterObject(req) {
        var twitter = new Twitter({
            consumer_key: authIDs.twitterAuth.clientID,
            consumer_secret: authIDs.twitterAuth.clientSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        return twitter;
    }


    var posts = require('../data/posts')

    app.get("/", function (req, res) {
        res.render("index.ejs")
    })


    app.get("/profile", isLoggedIn, function (req, res) {
        res.render("profile.ejs", {
            user: req.user
        })
    })

    app.get("/logout", function (req, res) {
        req.logout()
        res.redirect("/")
    })

    app.get("/login", function (req, res) {
        res.render("login.ejs", {message: req.flash("loginMessage")})
    })

    app.post("/login", passport.authenticate("local-login", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/login", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }))


    app.get("/signup", function (req, res) {
        res.render("signup.ejs", {message: req.flash("signupMessage")})
    })

    app.post("/signup", passport.authenticate("local-signup", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/signup", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }))

    app.get("/auth/facebook", passport.authenticate("facebook", {scope: "email"}))


    app.get("/auth/facebook/callback",
        passport.authenticate("facebook", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))

    // send to twitter to do the authentication
    app.get("/auth/twitter", passport.authenticate("twitter", {scope: "email"}))


    app.get("/auth/twitter/callback",
        passport.authenticate("twitter", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))


    app.get("/auth/google", passport.authenticate("google", {scope: ["profile", "email"]}))


    app.get("/auth/google/callback",
        passport.authenticate("google", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))

    app.get("/connect/local", function (req, res) {
        res.render("connect-local.ejs", {message: req.flash("loginMessage")})
    })
    app.post("/connect/local", passport.authenticate("local-signup", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/connect/local", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }))

    app.get("/connect/facebook", passport.authorize("facebook", {scope: "email"}))

    app.get("/connect/facebook/callback",
        passport.authorize("facebook", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))

    app.get("/connect/twitter", passport.authorize("twitter", {scope: "email"}))

    app.get("/connect/twitter/callback",
        passport.authorize("twitter", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))

    app.get("/connect/google", passport.authorize("google", {scope: ["profile", "email"]}))

    app.get("/connect/google/callback",
        passport.authorize("google", {
            successRedirect: "/profile",
            failureRedirect: "/"
        }))

    app.get("/unlink/local", isLoggedIn, function (req, res) {
        var user = req.user
        user.local.email = undefined
        user.local.password = undefined
        user.save(function (err) {
            res.redirect("/profile")
        })
    })

    app.get("/unlink/facebook", isLoggedIn, function (req, res) {
        var user = req.user
        user.facebook.token = undefined
        user.save(function (err) {
            res.redirect("/profile")
        })
    })

    app.get("/unlink/twitter", isLoggedIn, function (req, res) {
        var user = req.user
        user.twitter.token = undefined
        user.save(function (err) {
            res.redirect("/profile")
        })
    })

    app.get("/unlink/google", isLoggedIn, function (req, res) {
        var user = req.user
        user.google.token = undefined
        user.save(function (err) {
            res.redirect("/profile")
        })
    })

    app.get("/timeline", isLoggedIn, then(async (req, res) => {
        var twitter = buildTwitterObject(req)
        let [tweets] = await twitter.promise.get("statuses/home_timeline")
        let posts = tweets.map(tweet => {
            return {
                id: tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@' + tweet.user.screen_name,
                liked: tweet.favorited,
                network: {
                    icon: 'twitter',
                    name: 'Twitter',
                    class: 'btn-info'
                }
            }
        })

        res.render("timeline.ejs", {
            posts: posts
        })
    }))


    app.post("/like/:id", isLoggedIn, then(async (req, res) => {
        try {
            var twitter = buildTwitterObject(req)
            let id = req.params.id;
            await twitter.promise.post('favorites/create', {id})
            res.end()
        } catch (e) {
            console.log(e)
        }
    }))


    app.post("/unlike/:id", isLoggedIn, then(async (req, res) => {
        var twitter = buildTwitterObject(req)
        let id = req.params.id
        await twitter.promise.post('favorites/destroy', {id})
        res.end()
    }))


    app.get("/reply/:id", isLoggedIn, then(async (req, res) => {
        let id = req.params.id
        console.log("ID: " + req.param('user'))
        res.render("reply.ejs", {id: id, username: req.param('user')})
    }))

    app.post("/reply/:id", isLoggedIn, then(async (req, res) => {
        try {
            var twitter = buildTwitterObject(req)
            let id = req.params.id
            let message = req.body.message
            await twitter.promise.post('statuses/update', {'status': message, 'in_reply_to_status_id': id})
            res.redirect('/timeline')
        } catch (e) {
            console.log(e)
        }
    }))

    app.get("/share/:id", isLoggedIn, then(async (req, res) => {
        try {
            var twitter = buildTwitterObject(req)
            let id = req.params.id
            await twitter.promise.post('statuses/retweet/' + id)
            res.redirect('/timeline', req)
        } catch (e) {
            console.log(e)
        }
    }))


}


