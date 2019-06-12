const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const Group = require("../models/group");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/subGroups");
  },
  filename: function(req, file, cb) {
    var id = uuid();
    let imgType = file.mimetype.substring(file.mimetype.indexOf("/") + 1);
    cb(null, id + "." + imgType);
  }
});

var upload = multer({ storage: storage }).single("image");

router.post("/", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    upload(req, res, function(err) {
      if (err) {
        return res
          .status(201)
          .json({ isSuccess: false, message: "image not saved" });
      }
      let fileName = "";
      if (req.file !== undefined) {
        fileName = req.file.filename;
      }
      var group = new Group({
        subGroupName: req.body.subGroupName,
        group: req.body.group,
        imagePath: fileName,
        user: userID
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
          deleteFile(fileName);
          res.status(201).json({
            isSuccess: false,
            message: "SubGroup with same name alreay exists"
          });
        });
    });
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
});

router.get("/", function(req, res) {
  let userID = 0;
  if (req.query.userID !== undefined) {
    userID = getUserIdFromToken(req.query.userID);
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
      isSuccess: true,
      subGroups: subGroupsMap
    });
  });
});

router.put("/", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID === 0) {
    return res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "Problem while saving Image"
      });
    }
    const previousFile = req.body.imagePath;
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }

    var newSubGroup = new SubGroup({
      _id: req.query.subGroupID,
      user: req.user.userID,
      group: req.body.group,
      subGroupName: req.body.subGroupName,
      imagePath: fileName
    });
    SubGroup.findOneAndUpdate(
      { _id: req.query.subGroupID, user: req.query.userID },
      newSubGroup,
      err => {
        if (err) {
          res.status(201).json({
            isSuccess: false,
            message: "SubGroup with same name alreay exists"
          });
          deleteFile(previousFile);
        } else {
          res.status(201).json({
            isSuccess: true,
            message: "SubGroup updated"
          });
          deleteFile(fileName);
        }
      }
    );
  });
});

router.get("/group", function(req, res) {
  let userID = 0;
  if (req.query.userID !== undefined) {
    userID = getUserIdFromToken(req.query.userID);
  }
  const url = req.protocol + "://" + req.get("host") + "/";
  SubGroup.find({ group: req.query.groupID }, function(err, subGroups) {
    var subGroupsMap = [];
    subGroups.forEach(function(subGroup) {
      subGroup.imagePath = url + subGroup.imagePath;
      if (subGroup.user === userID) subGroup.isEditable = true;
      else subGroup.isEditable = false;
      subGroupsMap.push(subGroup);
    });
    res.status(201).json({
      isSuccess: true,
      subGroups: subGroupsMap
    });
  });
});

router.get("/subGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    SubGroup.findById({ _id: req.query.subGroupID }, function(err, subGroup) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "SubGroup not found"
        });
      } else {
        if (subGroup.user !== userID) {
          res.status(201).json({
            isSuccess: false,
            message: "Session expired.Please login again"
          });
        } else {
          const url = req.protocol + "://" + req.get("host") + "/";
          subGroup.imagePath = url + subGroup.imagePath;
          res.status(201).json({
            isSuccess: true,
            subGroup: subGroup
          });
        }
      }
    });
  }
});

router.delete("/", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    SubGroup.findOneAndDelete(
      { _id: req.query.subGroupID, user: userID },
      function(err, subGroup) {
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
          deleteFile(subGroup.imagePath);
        }
      }
    );
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "Session expires.Please login again."
    });
  }
});

const deleteFile = fileName => {
  if (
    (fs.exists(fileName),
    () => {
      fs.unlink(`/public/subGroups/${fileName}`);
    })
  );
};

module.exports = router;
