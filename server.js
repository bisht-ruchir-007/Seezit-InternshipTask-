var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var PORT = process.env.PORT || 3000;
var mongoose = require("mongoose");

// connection to the db
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/todo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

// user Schema
var userSchema = new mongoose.Schema({
  useremail: { type: String, unique: true },
  password: { type: String },
  username: { type: String },
});

// address Schema
var addressSchema = new mongoose.Schema({
  user: String,
  address_1: String,
  address_2: String,
  city: String,
  state: String,
  pincode: Number,
});

// Global variables
var CurrentUser;
var isUserLoggedIn = false;

// DB variables
var Address = mongoose.model("addresses", addressSchema);
var User = mongoose.model("myuser", userSchema);

// ---------- Routes ----------------

// Home page
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// login page
app.get("/login_page", (req, res) => {
  isUserLoggedIn = false;
  CurrentUser = new User();
  res.render("login.ejs", { alertmsg: "" });
});

//Register Page
app.get("/register_page", (req, res) => {
  isUserLoggedIn = false;
  CurrentUser = new User();
  res.render("register.ejs");
});

// Register the User
app.post("/register", (req, res) => {
  var newUser = new User({
    useremail: req.body.useremail,
    username: req.body.username,
    password: req.body.password,
  });

  // storing the details of the user
  User.create(newUser, (err, newUser) => {
    if (err) {
      console.log(err);
    } else {
      console.log("new user added !!" + newUser);
      res.redirect("/login_page");
    }
  });
});

// User Home Page after login
app.get("/userhome", (req, res) => {
  if (isUserLoggedIn) {
    res.render("userhome.ejs", { user: CurrentUser });
  } else {
    res.redirect("/login_page");
  }
});

//loginAuth for the user
app.post("/userhome", (req, res) => {
  User.findOne(
    { useremail: req.body.useremail, password: req.body.password },
    (err, user) => {
      if (err) {
        console.log(err);
      }
      if (!user) {
        res.render("login.ejs", { alertmsg: "INVALID CREDENTIALS" });
      } else {
        CurrentUser = new User({
          useremail: user.useremail,
          username: user.username,
          password: user.password,
        });
        isUserLoggedIn = true;
        res.render("userhome.ejs", { user: CurrentUser });
      }
    }
  );
});

// user profile
app.get("/profile", (req, res) => {
  if (!isUserLoggedIn) {
    res.redirect("/");
  } else {
    // counting the number of stored address bt the current user
    Address.find({ user: CurrentUser.useremail }, (err, Location_List) => {
      if (err) {
        console.log(err);
      } else {
        var total_saved_locations = Location_List.length;

        res.render("userProfile.ejs", {
          user: CurrentUser,
          total_saved_locations: total_saved_locations,
        });
      }
    });
  }
});

// add address
app.get("/add_address", (req, res) => {
  if (isUserLoggedIn) {
    res.render("input_address.ejs", { alertmsg: "" });
  } else {
    res.redirect("/login_page");
  }
});

// address via map
app.get("/add_address_via_map", (req, res) => {
  if (isUserLoggedIn) {
    res.render("map.ejs");
  } else {
    res.redirect("/login_page");
  }
});

// address via form
app.get("/add_address_via_form", (req, res) => {
  if (isUserLoggedIn) {
    res.render("form.ejs");
  } else {
    res.redirect("/login_page");
  }
});

//save address via map
app.post("/saveAddressviaMap", (req, res) => {
  var address = req.body;
  //console.log(address);
  var newAddress = new Address({
    user: CurrentUser.useremail,
    address_1: address.inputAddress1,
    address_2: address.inputAddress2,
    city: address.inputCity,
    state: address.inputState,
    pincode: address.inputPinCode,
  });
  // create a new address in the MongoDB
  Address.create(newAddress, (err, newItem) => {
    if (err) {
      console.log(err);
    } else {
      //console.log("new address added !!" + newAddress);
      res.redirect("/add_address");
    }
  });
});

// showing the tasks
app.get("/showLocations", (req, res) => {
  if (isUserLoggedIn) {
    // console.log(CurrentUser.useremail);
    // Finding all the Location storeb by the Current User
    Address.find({ user: CurrentUser.useremail }, (err, Location_List) => {
      if (err) {
        console.log(err);
      } else {
        //console.log(Location_List);
        res.render("showLocation.ejs", { Location_List: Location_List });
      }
    });
  } else {
    res.redirect("/login_page");
  }
});

// Catch all other routers
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`server started at ${PORT}`);
});
