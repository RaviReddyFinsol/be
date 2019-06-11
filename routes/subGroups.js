const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const SubGroup = require("../models/subGroup");
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
      var subGroup = new SubGroup({
        subGroupName: req.body.subGroupName,
        group: req.body.groupID,
        imagePath: fileName,
        user: userID
      });
      subGroup
        .save()
        .then(createdChildGroup => {
          res.status(201).json({
            isSuccess: true,
            message: "SubGroup added successfully"
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
  SubGroup.find({}, function(err, subGroups) {
    var subGroupsMap = [];
    subGroups.forEach(function(childGroup) {
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
  let userID = getUserIdFromToken(req.body.userID);
  let subGroup = SubGroup.findById(req.query.subGroupID);
  if (userID === 0) {
    return res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
  if (subGroup === undefined) {
    return res.status(201).json({
      isSuccess: false,
      message: "SubGroup not exists"
    });
  }
  if (subGroup.user !== userID) {
    return res.status(201).json({
      isSuccess: false,
      message: "Can't modify SubGroup.Access denied"
    });
  }
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "Problem while saving Image"
      });
    }
    const previousFile = subGroup.imagePath;
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }

    subGroup.imagePath = fileName;
    subGroup.group = req.body.group;
    subGroup.subGroupName = req.body.subGroupName;
    subGroup
      .update()
      .then(i => {
        res.status(201).json({
          isSuccess: true,
          message: "SubGroup updated"
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

router.get("/subGroup", function(req, res) {
  let userID = getUserIdFromToken(req.query.token);
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

router.get("/group", function(req, res) {
  if (req.query.groupID !== undefined) {
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
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "Group not found"
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
