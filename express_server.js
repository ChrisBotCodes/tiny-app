const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require ("body-parser");
const cookieParser = require('cookie-parser');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(express.static('public'));
app.set("view engine", "ejs");

// Function choosen a random alphanumeric character b/w '0' (ascii 48)
// and 'z' (ascii 122) while omitted special character in between.
// Not the most efficient code but I wanted to try this method.
function generateRandomString() {
  let uniqueID = "";
  const minASCII = 48;
  const maxASCII = 122
  let randIndex;
  const forbidChars = [58, 59, 60, 61, 62, 63, 64, 91, 92, 93, 94, 95, 96];
  while (uniqueID.length < 6) {
    randIndex = Math.floor(Math.random() * (maxASCII - minASCII + 1)) + minASCII;
    if (!forbidChars.includes(randIndex)) {
      uniqueID += String.fromCharCode(randIndex);
    }
  }
  return uniqueID;
};

function matchUser(email) {
  let returned;
  for (let rand in users) {
    if(email === users[rand].email) {
      returned = users[rand];
      break;
    } else {
      returned = 403;
    };
  };
  return returned;
}

let users = {};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  let login = { username: req.cookies["username"],
                info: users[req.cookies["user_id"]] };
  res.render("urls_home", login);
});

app.get("/register", (req, res) => {
  let login = { username: req.cookies["username"],
                info: users[req.cookies["user_id"]] }
  res.render("urls_register", login);
});

app.post("/register", (req, res) => {
  for (let rand in users) {
    if (req.body.email === users[rand].email) {
      res.status(400).send("Sorry, the email you entered is already in use.");
    };
  };
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send("Sorry, there was not enough information to process your registration. \nPlease enter both an email address and a password.");
  } else {
    let userID = generateRandomString();
    users[userID] = { id: userID,
                      email: req.body.email,
                      password: req.body.password,
                      database: {} };
    res.cookie("user_id", userID);
    res.redirect("/");
  };
});

app.get("/login", (req, res) => {
  let login = { username: req.cookies["username"],
                info: users[req.cookies["user_id"]] };
  res.render("urls_login", login);
})

app.post("/login", (req, res) => {
  let matchedUser = matchUser(req.body.email);
  if ((matchedUser === 403) || matchedUser === undefined) {
    res.status(403);
    res.send("This email does not match any account in our system.");
  } else {
    if (matchedUser.password === req.body.password) {
      res.cookie("user_id", matchedUser.id);
      res.redirect("/");
    } else {
      res.status(403);
      res.send("Sorry, this password does not match the info for the given email.");
    };
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
})

app.get("/urls/new", (req, res) => {
  let login = { username: req.cookies["username"],
                info: users[req.cookies["user_id"]] };
  res.render("urls_new", login);
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    let generatedCode = generateRandomString();
    if (req.body.longURL.slice(0, 7) === "http://" || req.body.longURL.slice(0, 8) === "https://") {
      urlDatabase[generatedCode] = req.body.longURL;
      users[req.cookies["user_id"]].database[generatedCode] = req.body.longURL;
      res.redirect('/urls/' + generatedCode);
    } else {
      urlDatabase[generatedCode] = "http://" + req.body.longURL;
      users[req.cookies["user_id"]].database[generatedCode] = "http://" + req.body.longURL;
      res.redirect('/urls/' + generatedCode);
    };
  } else {
    res.status(401).send("You need to be logged in to shorten a URL.");
  };
});

app.get("/urls" , (req, res) => {
  console.log(req.cookies["user_id"]);
  if (req.cookies["user_id"]) {
    let locals = { urls: users[req.cookies["user_id"]].database,
                   username: req.cookies["username"],
                   info: users[req.cookies["user_id"]], };
    res.render("urls_index", locals);
  } else {
    res.status(401);
    res.send("You need to be logged in to view this page.");
  }
});

app.get("/urls/:id" , (req, res) => {
  let locals = { shortURL: req.params.id,
                 longURL: urlDatabase,
                 username: req.cookies["username"],
                 info: users[req.cookies["user_id"]] };
  res.render("urls_show", locals);
});

app.get("/u/:shortURL", (req, res) => {
  let locals = { 'randCode': req.params.shortURL };
  let longURL = urlDatabase[locals.randCode];
  res.redirect(longURL);
});

// deletes the object key-value pair corr. to id and redircts to /urls page
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id]
  res.redirect("/urls");
})

// updates an existing entry's long URL
app.post("/:id/update", (req, res) => {
  if (req.body.updatedLongURL.slice(0, 7) === "http://") {
    urlDatabase[req.params.id] = req.body.updatedLongURL;
  } else {
    urlDatabase[req.params.id] = "http://" + req.body.updatedLongURL;
  };
  res.redirect("/urls")
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
