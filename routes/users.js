var bcrypt = require("bcryptjs");
const express = require("express");
const router = express.Router();
const User = require("../models/user");
var Token = require("../auth/token");
var validateName = require("../shared/methods");
const logger = require("../logger/log4js");

var generateUserToken = Token.generateToken;

router.get("", (req, res) => {
  User.find()
    .then(users => {
      res.status(201).json({
        message: "Users fetched successfully!",
        posts: users
      });
    })
    .catch(err => {
      logger.error(err);
      res
        .status(201)
        .json({ message: "Something went wrong.Please try again" });
    });
});

router.post("/signup", (req, res) => {
  if(!validateName(req.body.userName))
  {
    return res.status(201).json({isSuccess : false, message : "Invalid User Name"});
  }
  if(!validateName(req.body.userName))
  {
    return res.status(201).json({isSuccess : false, message : "Invalid User ID"});
  }
  if(req.body.password === undefined || req.body.password.length < 5)
  {    
    return res.status(201).json({isSuccess : false, message : "Password should be atleast 6 characters"});
  }
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
      logger.error(err);
          let errorMessage = "Something went wrong.Please try again";
          if (
            err.errmsg !== undefined &&
            err.errmsg.includes("duplicate key error")
          )
            errorMessage = "UserID already exists";
          res.status(201).json({
            isSuccess: false,
            message: errorMessage
          });
    });
});

router.post("/login", (req, res) => {
  
  if(!validateName(req.body.userID))
  {
    return res.status(201).json({isSuccess : false, message : "Invalid User ID"});
  }
  if(req.body.password === undefined || req.body.password.length < 5)
  {    
    return res.status(201).json({isSuccess : false, message : "Invalid password"});
  }
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
        else
         res.status(201).json({ isSuccess: false, message: "Invalid password" });
      }
    })
    .catch(err => {
      logger.error(err);
      res.status(201).json({
        isSuccess: false,
        message: "Something went wrong.Please try again"
      });
    });
});

module.exports = router;
