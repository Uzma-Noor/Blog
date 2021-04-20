//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const _ = require("lodash");
const mongoose = require("mongoose");
mongoose.connect('mongodb+srv://admin-uzma:uzma10@cluster0.oqnhu.mongodb.net/blogPostDB', {useNewUrlParser: true, useUnifiedTopology: true});

const homeStartingContent = "This blog could be one of the most valuable things you’ve ever owned… It all depends on what you fill the pages with.";
const aboutContent = "This is a blog page started to interact with people around. This is an initiative where people could resonate on their thoughts. Where one can talk and be heard. Where a story of one could uplift and cheer the other. Where we could continue to grow and to share our experiences. So go ahead and sprinkle the page with your ideas and success stories.";
const contactContent = "Please feel free to drop by our inbox. We would love to hear from you ❤";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

let posts = [];

const BlogContentSchema = mongoose.Schema({
  title : String,
  content: String
});

const BlogContent = mongoose.model("BlogContent", BlogContentSchema);

app.get("/", function(req, res){
  BlogContent.find({}, function(err, blogContents){
    if(!err)
      res.render('home', {startingContent:homeStartingContent, posts:blogContents});
  });
});

app.get("/about", function(req, res){
  res.render('about', {aboutContent:aboutContent});
});

app.get("/contact", function(req, res){
  res.render('contact', {contactContent:contactContent});
});

app.get("/compose", function(req, res){
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
    if(!err)
      res.render("post", {selectedPostTitle:post.title, selectedPostContent: post.content, selectedPostId: post._id});
  });
});

app.post("/delete", function(req, res){
  const reqPostId = req.body.postId;
  BlogContent.deleteOne({_id: reqPostId}, function(err, post){
    if(err)
      console.log(err);
    res.redirect("/");
  });
});

app.listen(process.env.PORT || 8000, function(req, res){
    console.log("listening..");
});













app.listen(3000, function() {
  console.log("Server started on port 3000");
});
