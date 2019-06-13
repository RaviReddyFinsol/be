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
        group: req.body.group,
        imagePath: fileName,
        user: userID
      });
      subGroup
        .save()
        .then(createdGroup => {
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

    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.filename;
    }
    SubGroup.findById(req.query.groupID, function(err, subGroup) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "SubGroup with same name already exists"
        });
        deleteFile(fileName);
      } else {
        if (subGroup.user === userID) {
          const previousFile = subGroup.imagePath;
          subGroup.imagePath = fileName;
          subGroup.group = req.body.group;
          subGroup.subGroupName = req.body.subGroupName;
          subGroup
            .save()
            .then(data => {
              deleteFile(previousFile);
              res.status(201).json({
                isSuccess: false,
                message: "SubGroup updated"
              });
            })
            .catch(err => {
              res.status(201).json({
                isSuccess: false,
                message: "SubGroup not updated"
              });
              deleteFile(fileName);
            });
        } else {
          res.status(201).json({
            isSuccess: false,
            message: "Access denied"
          });
          deleteFile(fileName);
        }
      }
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
  if (fileName !== undefined) {
    let filePath = "/public/subGroups/" + fileName;
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath);
    } else {
      console.log("File not found " + filePath);
    }
    // if (
    //   (fs.exists(filePath),
    //   (err) => {
    //     fs.unlink(filePath);
    //   })
    // );
  }
};

module.exports = router;
