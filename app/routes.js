let Twitter = require("twitter")
let fbgraph = require("fbgraph")
let then = require('express-then')
var google = require('googleapis')
var mirror = google.mirror('v1')


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
        return twitter
    }

    function buildTwitterObject(req) {
        var twitter = new Twitter({
            consumer_key: authIDs.twitterAuth.clientID,
            consumer_secret: authIDs.twitterAuth.clientSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        })
        return twitter;
    }


    let networks = {
        twitter: {
            icon: 'twitter',
            name: 'Twitter',
            class: 'btn-info'
        },
        facebook: {
            icon: 'facebook',
            name: 'Facebook',
            class: 'btn-primary'
        }
    }


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

    app.get("/auth/facebook", passport.authenticate("facebook", {scope: ['email', 'manage_pages', 'publish_pages', 'user_posts', 'user_photos', 'read_stream', 'public_profile', 'user_likes', 'publish_actions']}))


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

    app.get("/connect/facebook", passport.authorize("facebook", {scope: ['email', 'manage_pages', 'publish_pages', 'user_posts', 'user_photos', 'read_stream', 'public_profile', 'user_likes', 'publish_actions']}))

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
        try {
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
            fbgraph.setAccessToken(req.user.facebook.token)

            let fbPosts = await fbgraph.promise.get("me/feed")


            let fbPostsObjects = posts = fbPosts['data'].map(fbPost=> {
                return {
                    id: fbPost.id,
                    image: fbPost.picture,
                    text: fbPost.description ? fbPost.description : fbPost.message ? fbPost.message : "",
                    name: fbPost.from.name,
                    username: fbPost.name ? fbPost.name : fbPost.from.name,
                    liked: fbPost.likes && fbPost.likes.data.length > 0,
                    link: fbPost.link,
                    network: {
                        icon: 'facebook',
                        name: 'Facebook',
                        class: 'btn-primary'
                    }
                }
            })
            posts = posts.concat(fbPostsObjects)

            /*fbPosts.map(fbPost=>{
             return {
             id = fbPost.
             }
             });*/


            /*let fbposts = await fbgraph.promise.post(req.user.facebook.id + '/feed?access_token' + req.user.facebook.token);
             console.log(fbposts)*/

            res.render("timeline.ejs", {
                posts: posts
            })
        } catch (e) {
            console.log(e)
        }
    }))


    app.post("/like/:id", isLoggedIn, then(async (req, res) => {
        try {
            if (req.query.network === 'Facebook') {

                await fbgraph.promise.post(req.params.id + '/likes')
            } else {
                var twitter = buildTwitterObject(req)
                let id = req.params.id;
                await twitter.promise.post('favorites/create', {id})
            }

            res.end()
        } catch (e) {
            console.log(e)
        }
    }))


    app.post("/unlike/:id", isLoggedIn, then(async (req, res) => {

        if (req.query.network === 'Facebook') {
            await fbgraph.promise.del(req.params.id + '/likes')
        } else {

            var twitter = buildTwitterObject(req)
            let id = req.params.id
            await twitter.promise.post('favorites/destroy', {id})
        }
        res.end()
    }))


    app.get("/reply/:id", isLoggedIn, then(async (req, res) => {
        let id = req.params.id

        res.render("reply.ejs", {
            id: id,
            network: req.param('network'),
            username: req.param('network') === 'Twitter' ? req.param('user') : ''
        })
    }))

    app.post("/reply/:id", isLoggedIn, then(async (req, res) => {
        try {

            if (req.query.network === 'Facebook') {
                console.log('Facebook Message ')
                await fbgraph.promise.post(req.params.id + '/comments', {'message': req.body.message})

            } else if (req.query.network === 'Twitter') {

                var twitter = buildTwitterObject(req)
                let id = req.params.id
                let message = req.body.message
                await twitter.promise.post('statuses/update', {'status': message, 'in_reply_to_status_id': id})
            }
            res.redirect('/timeline')
        } catch (e) {
            console.log(e)
        }
    }))

    app.get("/share/:id", isLoggedIn, then(async (req, res) => {
        try {
            if (req.param('network') === 'Facebook') {
                fbgraph.setAccessToken(req.user.facebook.token)
                await fbgraph.promise.post('me/feed', {link: req.param('link'), message: "Test Share"})

            } else if (req.param('network') === 'Twitter') {
                var twitter = buildTwitterObject(req)
                let id = req.params.id
                await twitter.promise.post('statuses/retweet/' + id)
            }
            res.redirect('/timeline')
        } catch (e) {
            console.log(e)
        }
    }))


    app.get("/compose", isLoggedIn, then(async(req, res)=> {
        res.render("compose", {networks: networks})
    }))

    app.post("/compose", isLoggedIn, then(async(req, res)=> {
        console.log(req.body.reply)
        console.log(req)
        if (req.body.network === 'Facebook') {
            console.log(req.body.reply)
            fbgraph.setAccessToken(req.user.facebook.token)
            await fbgraph.promise.post("/me/feed", {
                "message": req.body.reply
            })

        } else if (req.body.network === 'Twitter') {
            var twitter = buildTwitterObject(req)
            var status = req.body.reply
            await twitter.promise.post('statuses/update', {status})
        }

        res.redirect("/timeline")
    }))


}


