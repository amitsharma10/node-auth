"use strict";

var Twitter = require("twitter");
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }res.redirect("/");
}

module.exports = function (app, passport) {
    var posts = require("../data/posts");

    app.get("/", function (req, res) {
        res.render("index.ejs");
    });

    app.get("/profile", isLoggedIn, function (req, res) {
        res.render("profile.ejs", {
            user: req.user
        });
    });

    app.get("/logout", function (req, res) {
        req.logout();
        res.redirect("/");
    });

    app.get("/login", function (req, res) {
        res.render("login.ejs", { message: req.flash("loginMessage") });
    });

    app.post("/login", passport.authenticate("local-login", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/login", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get("/signup", function (req, res) {
        res.render("signup.ejs", { message: req.flash("signupMessage") });
    });

    app.post("/signup", passport.authenticate("local-signup", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/signup", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get("/auth/facebook", passport.authenticate("facebook", { scope: "email" }));

    app.get("/auth/facebook/callback", passport.authenticate("facebook", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    // send to twitter to do the authentication
    app.get("/auth/twitter", passport.authenticate("twitter", { scope: "email" }));

    app.get("/auth/twitter/callback", passport.authenticate("twitter", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

    app.get("/auth/google/callback", passport.authenticate("google", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    app.get("/connect/local", function (req, res) {
        res.render("connect-local.ejs", { message: req.flash("loginMessage") });
    });
    app.post("/connect/local", passport.authenticate("local-signup", {
        successRedirect: "/profile", // redirect to the secure profile section
        failureRedirect: "/connect/local", // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get("/connect/facebook", passport.authorize("facebook", { scope: "email" }));

    app.get("/connect/facebook/callback", passport.authorize("facebook", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    app.get("/connect/twitter", passport.authorize("twitter", { scope: "email" }));

    app.get("/connect/twitter/callback", passport.authorize("twitter", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    // google ---------------------------------

    // send to google to do the authentication
    app.get("/connect/google", passport.authorize("google", { scope: ["profile", "email"] }));

    // the callback after google has authorized the user
    app.get("/connect/google/callback", passport.authorize("google", {
        successRedirect: "/profile",
        failureRedirect: "/"
    }));

    app.get("/unlink/local", isLoggedIn, function (req, res) {
        var user = req.user;
        user.local.email = undefined;
        user.local.password = undefined;
        user.save(function (err) {
            res.redirect("/profile");
        });
    });

    // facebook -------------------------------
    app.get("/unlink/facebook", isLoggedIn, function (req, res) {
        var user = req.user;
        user.facebook.token = undefined;
        user.save(function (err) {
            res.redirect("/profile");
        });
    });

    // twitter --------------------------------
    app.get("/unlink/twitter", isLoggedIn, function (req, res) {
        var user = req.user;
        user.twitter.token = undefined;
        user.save(function (err) {
            res.redirect("/profile");
        });
    });

    // google ---------------------------------
    app.get("/unlink/google", isLoggedIn, function (req, res) {
        var user = req.user;
        user.google.token = undefined;
        user.save(function (err) {
            res.redirect("/profile");
        });
    });

    app.get("/timeline", isLoggedIn, function (req, res) {
        var twitter = new Twitter({
            consumer_key: app.config.auth.twitterAuth.clientID,
            consumer_secret: app.config.auth.twitterAuth.clientSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: req.user.twitter.secret
        });

        twitter.map;

        res.render("timeline.ejs", {
            posts: posts
        });
    });
};

//# sourceMappingURL=routes-compiled.js.map