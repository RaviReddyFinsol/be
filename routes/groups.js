const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const Group = require("../models/group");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");

var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "public/groups");
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
        groupName: req.body.groupName,
        imagePath: fileName,
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
  Group.find({}, function(err, groups) {
    var groupsMap = [];
    groups.forEach(function(group) {
      group.imagePath = url + group.imagePath;
      if (group.user === userID) group.isEditable = true;
      else group.isEditable = false;
      groupsMap.push(group);
    });
    res.status(201).json({
      isSuccess: true,
      groups: groupsMap
    });
  });
});

router.put("/", function(req, res) {
  //console.log(req.query);
  let userID = getUserIdFromToken(req.query.userID);
  if (userID === 0) {
    return res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
  let group;
  Group.find({ _id: req.query.groupID }, function(error, existGroup) {
    group = existGroup;
  });
  if (group === undefined) {
    return res.status(201).json({
      isSuccess: false,
      message: "Group not exists"
    });
  }
  if (group.user !== userID) {
    return res.status(201).json({
      isSuccess: false,
      message: "Can't modify Group.Access denied"
    });
  }
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "Problem while saving Image"
      });
    }
    const previuosFile = group.imagePath;
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }

    group.imagePath = fileName;
    group.groupName = req.body.groupName;
    group
      .update()
      .then(i => {
        res.status(201).json({
          isSuccess: true,
          message: "Group updated"
        });
        deleteFile(previuosFile);
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

router.get("/group", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    Group.findById({ _id: req.query.groupID }, function(err, group) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "Group not found"
        });
      } else {
        if (group.user !== userID) {
          res.status(201).json({
            isSuccess: false,
            message: "Session expired.Please login again"
          });
        } else {
          const url = req.protocol + "://" + req.get("host") + "/";
          group.imagePath = url + group.imagePath;
          res.status(201).json({
            isSuccess: true,
            group: group
          });
        }
      }
    });
  }
});

router.delete("/", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    Group.findOneAndDelete({ _id: req.query.groupID, user: userID }, function(
      err,
      group
    ) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "Something went wrong.Please try again"
        });
      } else {
        res.status(201).json({
          isSuccess: true,
          message: "Group deleted"
        });
        deleteFile(group.imagePath);
      }
    });
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
      fs.unlink(`/public/groups/${fileName}`);
    })
  );
};

module.exports = router;
