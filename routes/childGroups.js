const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const ChildGroup = require("../models/childGroup");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/childGroups");
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
      var childGroup = new ChildGroup({
        subGroup: req.body.subGroup,
        childGroupName: req.body.childGroupName,
        imagePath: fileName,
        user: userID
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
          deleteFile(fileName);
          res.status(201).json({
            isSuccess: false,
            message: "Something went wrong.Please try again"
          });
        });
    });
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again"
    });
  }
});

router.get("/", function(req, res) {
  let userID = 0;
  if (req.query.userID !== undefined) {
    userID = getUserIdFromToken(req.query.userID);
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
      isSuccess: true,
      childGroups: childGroupsMap
    });
  });
});

router.put("/", function(req, res) {
  let userID = getUserIdFromToken(req.body.userID);
  let childGroup = ChildGroup.findById(req.query.childGroupID);
  if (userID === 0) {
    return res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
  if (childGroup === undefined) {
    return res.status(201).json({
      isSuccess: false,
      message: "ChildGroup not exists"
    });
  }
  if (childGroup.user !== userID) {
    return res.status(201).json({
      isSuccess: false,
      message: "Can't modify ChildGroup.Access denied"
    });
  }
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "Problem while saving Image"
      });
    }
    const previousFile = childGroup.imagePath;
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }

    childGroup.imagePath = fileName;
    childGroup.group = req.body.subGroup;
    childGroup.childGroupName = req.body.childGroupName;
    childGroup
      .update()
      .then(i => {
        res.status(201).json({
          isSuccess: true,
          message: "ChildGroup updated"
        });
        deleteFile(previousFile);
      })
      .catch(err => {
        res.status(201).json({
          isSuccess: false,
          message: "Something went wrong.Please try again"
        });
        deleteFile(fileName);
      });
  });
});

router.get("/childGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.token);
  if (userID !== 0) {
    ChildGroup.findById({ _id: req.query.childGroupID }, function(
      err,
      childGroup
    ) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "ChildGroup not found"
        });
      } else {
        if (childGroup.user !== userID) {
          res.status(201).json({
            isSuccess: false,
            message: "Session expired.Please login again"
          });
        } else {
          const url = req.protocol + "://" + req.get("host") + "/";
          childGroup.imagePath = url + childGroup.imagePath;
          res.status(201).json({
            isSuccess: true,
            childGroup: childGroup
          });
        }
      }
    });
  }
});

router.delete("/", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    ChildGroup.findOneAndDelete(
      { _id: req.query.childGroupID, user: userID },
      function(err, childGroup) {
        if (err) {
          res.status(201).json({
            isSuccess: false,
            message: "Something went wrong.Please try again"
          });
        } else {
          res.status(201).json({
            isSuccess: true,
            message: "ChildGroup deleted"
          });
          deleteFile(childGroup.imagePath);
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

router.get("/subroup", function(req, res) {
  if (req.query.subGroupID !== undefined) {
    let userID = 0;
    if (req.query.userID !== undefined) {
      userID = getUserIdFromToken(req.query.userID);
    }
    const url = req.protocol + "://" + req.get("host") + "/";
    childGroup.find({ subGroup: req.query.subGroupID }, function(
      err,
      childGroups
    ) {
      var childGroupsMap = [];
      childGroups.forEach(function(childGroup) {
        childGroup.imagePath = url + childGroup.imagePath;
        if (childGroup.user === userID) childGroup.isEditable = true;
        else childGroup.isEditable = false;
        childGroupsMap.push(childGroup);
      });
      res.status(201).json({
        isSuccess: true,
        childGroups: childGroupsMap
      });
    });
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "SubGroup not found"
    });
  }
});

const deleteFile = fileName => {
  if (
    (fs.exists(fileName),
    () => {
      fs.unlink(`/public/childGroups/${fileName}`);
    })
  );
};

module.exports = router;
