const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const Group = require("../models/group");
const SubGroup = require("../models/subGroup");
const ChildGroup = require("../models/childGroup");
var validateToken = require("../auth/token");

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public");
  },
  filename: function(req, file, cb) {
    var id = uuid();
    let imgType = file.mimetype.substring(file.mimetype.indexOf("/") + 1);
    cb(null, id + "." + imgType);
  }
});

var upload = multer({ storage: storage }).single("image");

router.post("/group/add", function(req, res) {
  //console.log(req.body);
  //var userName = "test"; //validateToken.getUserNameFromToken(req);
  //if (userName == "" && userName == undefined) {
  upload(req, res, function(err) {
    if (err) {
      return res.status(500).json(err);
    }
    var userID = validateToken.getUserNameFromToken(req.body.token);
    console.log(userID);
    var group = new Group({
      groupName: req.body.groupName,
      imagePath: req.file.filename,
      user: userID
    });
    group
      .save()
      .then(createdGroup => {
        res.status(201).json({
          isSuccess: true,
          message: "Group added successfully"
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
  // } else {
  //   res.status(201).json({
  //     isSuccess: false,
  //     message: "Invalid User"
  //   });
  // }
});

router.post("/groups", function(req, res) {
  console.log(req.body);
  let userName = validateToken.getUserNameFromToken(req.body.token);
  Group.find({}, function(err, groups) {
    var groupsMap = [];
    groups.forEach(function(group) {
      if (group.userName === userName) group.isEditable = true;
      else group.isEditable = false;
      groupsMap.push(group);
    });
  });
});

module.exports = router;
