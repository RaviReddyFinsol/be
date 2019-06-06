const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const ChildGroup = require("../models/childGroup");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");

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

router.post("/childGroup/add", function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      return res
        .status(201)
        .json({ isSuccess: false, message: "image not saved" });
    }
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }
    let userID = getUserIdFromToken(req.body.token);
    if (userID !== 0) {
      var childGroup = new ChildGroup({
          subGroupName : req.body.subGroupName,
        childGroupName: req.body.childGroupName,
        imagePath: fileName,
        user: userID,
      });
      childGroup
        .save()
        .then(createdChildGroup => {
          res.status(201).json({
            isSuccess: true,
            message: "ChildGroup added successfully"
          });
        })
        .catch(err => {
          res.status(201).json({
            isSuccess: false,
            message: "Something went wrong.Please try again"
          });
        });
    } else {
      res.status(201).json({
        isSuccess: false,
        message: "Session expired.Please login again."
      });
    }
  });
});

router.get("/childGroups", function(req, res) {
  let userID = 0;
  if (req.query.token !== undefined) {
    userID = getUserIdFromToken(req.query.token);
  }
  const url = req.protocol + "://" + req.get("host") + "/";
  ChildGroup.find({}, function(err, childGroups) {
    var childGroupsMap = [];
    childGroups.forEach(function(childGroup) {
      childGroup.imagePath = url + childGroup.imagePath;
      if (childGroup.user === userID) childGroup.isEditable = true;
      else childGroup.isEditable = false;
      childGroupsMap.push(childGroup);
    });
    res.status(201).json({
      isSuccess: false,
      childGroups: childGroups
    });
  });
});

router.post("/childGroup/edit", function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "problem while saving Image"
      });
    }
    let userID = getUserIdFromToken(req.body.userID);
    if (userID !== 0) {
      let fileName = "";
      if (req.file !== undefined) {
        fileName = req.file.fileName;
      }
      var childGroup = {
          subGroupName : req.body.subGroupName,
        childGroupName: req.body.childGroupName,
        imagePath: fileName,
      };
      ChildGroup.findByIdAndUpdate(
        { _id: req.body.childGroupID, user: userID },
        childGroup,
        function(err) {
          if (err) {
            res.status(201).json({
              isSuccess: false,
              message: "ChildGroup not exists"
            });
          } else {
            res.status(201).json({
              isSuccess: true,
              message: "ChildGroup updated"
            });
          }
        }
      );
    } else {
      res.status(201).json({
        isSuccess: false,
        message: "Session expired.Please login again."
      });
    }
  });
});

router.get("/childGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.token);
  if (userID !== 0) {
    ChildGroup.findOne({ _id: req.query.childGroupID, user: userID }, function(err, obj) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "ChildGroup not found"
        });
      } else {
        const url = req.protocol + "://" + req.get("host") + "/";
        obj.imagePath = url + obj.imagePath;
        res.status(201).json({
          isSuccess: true,
          message: "ChildGroup updated",
          childGroup: obj
        });
      }
    });
  }
});

router.delete("/childGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    ChildGroup.findByIdAndRemove({ _id: req.query.childGroupID, user: userID }, function(
      err
    ) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "Something went wrong.Please try again"
        });
      } else {
        res.status(201).json({
          isSuccess: true,
          message: "Child Group deleted"
        });
      }
    });
  } else {
    res.status(201).json({
      isSuccess: true,
      message: "Session expires.Please login again."
    });
  }
});

module.exports = router;
