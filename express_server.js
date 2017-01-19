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

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  let login = { username: req.cookies["username"] };
  res.render("urls_home", login);
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

app.post("/login", (req, res) => {
  res.cookie("username", req.body.username)
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
})

app.get("/urls/new", (req, res) => {
  let login = { username: req.cookies["username"] }
  res.render("urls_new", login);
});

app.post("/urls", (req, res) => {
  console.log(req.body); // debug statement to see POST parameters
  let generatedCode = generateRandomString();
  if (req.body.longURL.slice(0, 7) === "http://") {
    urlDatabase[generatedCode] = req.body.longURL;
  } else {
    urlDatabase[generatedCode] = "http://" + req.body.longURL;
  };
  res.redirect('/urls/' + generatedCode);
});

app.get("/urls" , (req, res) => {
  let locals = { urls: urlDatabase,
                 username: req.cookies["username"] };
  res.render("urls_index", locals);
});

app.get("/urls/:id" , (req, res) => {
  let locals = { shortURL: req.params.id,
                 longURL: urlDatabase,
                 username: req.cookies["username"] };
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
