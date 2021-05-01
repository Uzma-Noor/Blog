//jshint esversion:6
require('dotenv').config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var findOrCreate = require('mongoose-findorcreate')
const HttpsProxyAgent = require('https-proxy-agent');
require('https').globalAgent.options.rejectUnauthorized = false;
app.use(session({
  secret: 'out little secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: false,
  }
}));
app.use(passport.initialize());
app.use(passport.session());
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });

    console.log("MongoDB connection SUCCESS");
  } catch (error) {
    console.error("MongoDB connection FAIL");
    process.exit(1);
  }
};
const importData = async () => {
  try {
    await connectDB();
    console.log("Data Import Success");
  } catch (error) {
    console.error("Error with data import", error);
    process.exit(1);
  }
};
importData();

const homeStartingContent = "This blog could be one of the most valuable things you’ve ever owned… It all depends on what you fill the pages with.";
const aboutContent = "This is a blog page started to interact with people around. This is an initiative where people could resonate on their thoughts. Where one can talk and be heard. Where a story of one could uplift and cheer the other. Where we could continue to grow and to share our experiences. So go ahead and sprinkle the page with your ideas and success stories.";
const contactContent = "Please feel free to drop by our inbox. We would love to hear from you ❤";

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let posts = [];

mongoose.set('useCreateIndex', true);

const userSchema =new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  })
});


const gStrategy = new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://blog-to-cheer.herokuapp.com/auth/google/about",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    // Make Strategy trust all proxy settings
    proxy: true
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
);
const agent = new HttpsProxyAgent(process.env.HTTP_PROXY || "http://192.168.23.4:999/");
gStrategy._oauth2.setAgent(agent);

passport.use(gStrategy);


passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "https://blog-to-cheer.herokuapp.com/auth/facebook/about"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log("Facebook profile" + profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

const BlogContentSchema = mongoose.Schema({
  title : String,
  content: String
});

const BlogContent = mongoose.model("BlogContent", BlogContentSchema);

app.get("/", function(req, res){
  console.log('authenticated', req.app.locals.authenticated);
  BlogContent.find({}, function(err, blogContents){
    if(!err)
      res.render('home', {startingContent:homeStartingContent, posts:blogContents, authenticated: req.app.locals.authenticated});
  });
});

//initiate authentication with google. use passport
//this brings popup to login to google account
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


//below route should be similar to the one given in the gooogle dev docs
app.get('/auth/google/about',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect about.
    req.app.locals.authenticated = req.isAuthenticated();
    res.redirect('/');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/about',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    req.app.locals.authenticated = req.isAuthenticated();
    res.redirect('/');
  });


app.get("/about", function(req, res){
  req.app.locals.authenticated = req.isAuthenticated();
  res.render('about', {aboutContent:aboutContent});
});

app.get("/contact", function(req, res){
  req.app.locals.authenticated = req.isAuthenticated();
  res.render('contact', {contactContent:contactContent});
});

app.get("/register", function(req, res){
  req.app.locals.authenticated = req.isAuthenticated();
  res.render('register');
});

app.get("/login", function(req, res){
  req.app.locals.authenticated = req.isAuthenticated();
  res.render('login');
});

app.get("/compose", function(req, res){
  req.app.locals.authenticated = req.isAuthenticated();
  res.render('compose', {postTitle: "", postContent: "", postId: ""});
});

app.post("/compose", function(req, res){
  const postId = req.body.postId;
  const existingContentId = req.body.publish;
  if(postId){
    //open existing edit content of post in compose mode
    BlogContent.findOne({_id: postId}, function(err, post){
      console.log(post);
      if(!err){
        req.app.locals.authenticated = req.isAuthenticated();
        res.render('compose', {postTitle: post.title, postContent: post.content, postId: post._id});
      }
    })
  }else if (existingContentId) {
    //If clicked on publish with existing content update the existing record
    const title = req.body.postTitle;
    const content = req.body.postContent;
    BlogContent.updateOne({_id: existingContentId}, {title : req.body.postTitle, content : req.body.postBody}, function(err, post){
      console.log(post);
        if(!err){
          req.app.locals.authenticated = req.isAuthenticated();
          res.redirect("/");
        }
    });
  }else{
    //If gone through compose mode in tool bar create a fresh content.
    const content = new BlogContent({
      title : req.body.postTitle,
      content : req.body.postBody
    });
    content.save(function(err){
     if (!err){
       req.app.locals.authenticated = req.isAuthenticated();
       res.redirect("/");
     }
   });
  }
});

/*
  app.get("/posts/:title", function(req, res){
    posts.forEach(function(post){
      if(_.lowerCase(post.title) == _.lowerCase(req.params.title)){
        console.log(_.lowerCase(post.title) + "Match Found" + _.lowerCase(req.params.title));
        res.render("post", {selectedPostTitle:post.title, selectedPostContent: post.content});
      }else{
        console.log("Match not found");
      }
    })
  });
*/

app.get("/posts/:postId", function(req, res){
  const requestedPostId = req.params.postId;
  BlogContent.findOne({_id: requestedPostId}, function(err, post){
    if(!err){
      req.app.locals.authenticated = req.isAuthenticated();
      res.render("post", {selectedPostTitle:post.title, selectedPostContent: post.content, selectedPostId: post._id, authenticated: req.isAuthenticated()});
    }
  });
});

app.post("/register", function(req, res){
  const username = req.body.username;
  const password = req.body.password;
  User.register({username:username}, password, function(err, user) {
    if (err) {
      console.log(err);
      req.app.locals.authenticated = req.isAuthenticated();
      res.redirect('register');
    }else{
      passport.authenticate("local")(req, res, function(){
        req.app.locals.authenticated = req.isAuthenticated();
        res.redirect("/");
      })
    }
      // Value 'result' is set to false. The user could not be authenticated since the user is not active
    });
  });

app.post("/login", function(req, res){
  const user = new User({
    userName: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) { console.log(err); }
    else{
      passport.authenticate("local")(req, res, function(){
        req.app.locals.authenticated = req.isAuthenticated();
        res.redirect('/');
      });
    }
  });
});

app.get("/logout", function(req, res){
  //deauthenticate user and end session
  req.logout();
  req.app.locals.authenticated = req.isAuthenticated();
  res.redirect('/');
})

app.post("/delete", function(req, res){
  const reqPostId = req.body.postId;
  BlogContent.deleteOne({_id: reqPostId}, function(err, post){
    if(err)
      console.log(err);
    req.app.locals.authenticated = req.isAuthenticated();
    res.redirect("/");
  });
});

app.listen(process.env.PORT || 3000, function(req, res){
    console.log("listening..");
});
