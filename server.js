// const chalkAnimation = require('chalk-animation');

// Dependencies
var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var artModel = require("./models/Article.js");

var cheerio = require("cheerio");
var request = require("request");

var logger = require("morgan");
var mongoose = require("mongoose");

const exphbs = require("express-handlebars");

const port = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Set up a static folder (public) for our web app
app.engine("handlebars", exphbs({
  defaultLayout: "main"
}));
app.set("view engine", "handlebars");

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({
  extended: false
}));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// By default mongoose uses callbacks for async queries, we're setting it to use promises (.then syntax) instead
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/redditMongoNewsApp");
// Database configuration
// Save the URL of our database as well as the name of our collection
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Use mongojs to hook the database to the db variable
var db = mongoose.connection;

// This makes sure that any errors are logged if mongodb runs into an issue
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// routes
app.get("/", function(req, res) {
  res.render("index");
});

app.get("/articles", function(req, res) {
  artModel.find({}, function(error, found) {

    if (error) {
      console.log(error);
    }
    // Otherwise, send the result of this query to the browser
    else {
      res.json(found);
    }
  });
});

app.get("/scrape", function(req, res) {
  request("https://www.reddit.com", function(error, response, html) {

    var $ = cheerio.load(html);

    $("p.title").each(function(i, element) {

      // Save the text of the element in a "title" variable
      var title = $(element).text();

      // In the currently selected element, look at its child elements (i.e., its a-tags),
      // then save the values for any "href" attributes that the child elements may have
      var link = $(element).children().attr("href");

      // var newArticle = new artModel ()
      artModel.create({
        title: title,
        // sum: sum,
        link: link
      }, function(error, saved) {
        if (error) {
          console.log(error);
        } else {}
      });
    });


  });
});

app.get("/saved", function(req, res) {
  artModel.find({
    "saved": "true"
  }, function(error, savedData) {

    if (error) {
      console.log(error);
    }
    // Otherwise, send the result of this query to the browser
    else {
      res.render("saved", savedData);
    }
  });
});

app.put("/saveart", function(req, res) {
  console.log("id is:", req.body.id);
  artModel.findOneAndUpdate({
      _id: req.body.id
    }, {
      "saved": true
    }, {
      new: true
    },
    function(error, doc) {});
  res.end();
});

// Set the app to listen on port 3000
app.listen(port, function() {
  console.log("App running on port " + port + "!");
});