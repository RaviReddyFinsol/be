const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const SubGroup = require("../models/subGroup");
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

router.post("/subGroup/add", function(req, res) {
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
      var subGroup = new SubGroup({
          subGroupName : req.body.subGroupName,
        groupName: req.body.groupName,
        imagePath: fileName,
        user: userID,
      });
      subGroup
        .save()
        .then(createdSubGroup => {
          res.status(201).json({
            isSuccess: true,
            message: "SubGroup added successfully"
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

router.get("/subGroups", function(req, res) {
  let userID = 0;
  if (req.query.token !== undefined) {
    userID = getUserIdFromToken(req.query.token);
  }
  const url = req.protocol + "://" + req.get("host") + "/";
  SubGroup.find({}, function(err, subGroups) {
    var subGroupsMap = [];
    subGroups.forEach(function(subGroup) {
      subGroup.imagePath = url + subGroup.imagePath;
      if (subGroup.user === userID) subGroup.isEditable = true;
      else subGroup.isEditable = false;
      subGroupsMap.push(subGroup);
    });
    res.status(201).json({
      isSuccess: false,
      subGroups: subGroups
    });
  });
});

router.post("/subGroup/edit", function(req, res) {
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
      var subGroup = {
          subGroupName : req.body.subGroupName,
        groupName: req.body.groupName,
        imagePath: fileName,
      };
      SubGroup.findByIdAndUpdate(
        { _id: req.body.subGroupID, user: userID },
        subGroup,
        function(err) {
          if (err) {
            res.status(201).json({
              isSuccess: false,
              message: "SubGroup not exists"
            });
          } else {
            res.status(201).json({
              isSuccess: true,
              message: "SubGroup updated"
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

router.get("/subGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.token);
  if (userID !== 0) {
    SubGroup.findOne({ _id: req.query.subGroupID, user: userID }, function(err, obj) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "SubGroup not found"
        });
      } else {
        const url = req.protocol + "://" + req.get("host") + "/";
        obj.imagePath = url + obj.imagePath;
        res.status(201).json({
          isSuccess: true,
          message: "SubGroup updated",
          subGroup: obj
        });
      }
    });
  }
});

router.delete("/subGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    SubGroup.findByIdAndRemove({ _id: req.query.subGroupID, user: userID }, function(
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
          message: "SubGroup deleted"
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
