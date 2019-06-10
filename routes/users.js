var bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
var Token = require("../auth/token");

var generateUserToken = Token.generateToken;

router.get("", (req, res) => {
  User.find()
    .then(users => {
      res.status(200).json({
        message: "Users fetched successfully!",
        posts: users
      });
    })
    .catch(err => {
      console.log(err);
      res
        .status(404)
        .json({ message: "Something went wrong.Please try again" });
    });
});

router.post("/signup", (req, res) => {
  var hashedPassword = bcrypt.hashSync(req.body.password);
  const user = new User({
    userName: req.body.userName,
    userID: req.body.userID,
    password: hashedPassword
  });
  user
    .save()
    .then(createdUser => {
      res.status(201).json({
        isSuccess: true,
        token: generateUserToken(createdUser._id)
      });
    })
    .catch(err => {
      console.log(err);
      res.status(404).json({
        isSuccess: false,
        message: "Something went wrong.Please try again"
      });
    });
});

router.post("/login", (req, res) => {
  User.findOne({ userID: req.body.userID })
    .then(user => {
      if (user === null) {
        res
          .status(201)
          .json({ isSuccess: false, message: "Invalid User Name" });
      } else {
        var isValid = bcrypt.compareSync(req.body.password, user.password);
        if (isValid) {
          res.status(201).json({
            isSuccess: true,
            token: generateUserToken(user._id)
          });
        }
        //res.status(201).json({ isSuccess: false, message: "Invalid password" });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(404).json({
        isSuccess: false,
        message: "Something went wrong.Please try again"
      });
    });
});

module.exports = router;
