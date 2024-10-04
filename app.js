const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const store = new MongoDBStore({
  uri: `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.bsfdbwm.mongodb.net/?retryWrites=true&w=majority`,
  databaseName: "test",
  collection: "sessions",
});
const mongoose = require("mongoose");
const path = require("path");
const compression = require("compression");

const donates = require("./routes/donates.js");
const users = require("./routes/users.js");

const app = express();

app.use(compression());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
  cors({
    origin: process.env.CLIENT,
    credentials: true,
  })
);
app.use((req, res, next) => {
  const allowedOrigins = process.env.CLIENT;
  const origin = req.headers.origin;
  if (allowedOrigins === origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "none", //"lax" if it's http
    },
  })
);

app.use("/donates", donates);
app.use("/users", users);
app.use((req, res) => {
  return res.redirect(`${process.env.CLIENT_APP}/123`);
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASS}@cluster0.bsfdbwm.mongodb.net/?retryWrites=true&w=majority`
  )
  .then((result) => {
    app.listen(process.env.PORT || 5000);
  })
  .catch((err) => console.log(err));
