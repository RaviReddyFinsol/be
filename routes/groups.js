const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");
const logger = require("../logger/log4js");

const Group = require("../models/group");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");
var path = require('path');
const validateName = require("../shared/methods");
const mimeType = require("../shared/dictionaries");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = mimeType[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, "public/groups");
  },
  filename: function (req, file, cb) {
    var id = uuid();
    const extension = mimeType[file.mimetype];
    cb(null, id + "." + extension);
  }
});

var upload = multer({ storage: storage, limits: { fileSize: 200000 } }).single(
  "image"
);

router.post("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    upload(req, res, function (err) {
      if (err) {
        logger.error(err);
        let error = "Something went wrong.Please try again";
        if (err.code === "LIMIT_FILE_SIZE")
          error = "Please select image less than 200kb";
        else if (err.message === "Invalid mime type")
          error = "Please select valid image(JPG/JPEG/PNG)";
        return res.status(201).json({ isSuccess: false, message: error });
      }
      let fileName = "";
      if (req.file !== undefined) {
        fileName = req.file.filename;
      }
      if (!validateName(req.body.groupName)) {
        deleteFile(fileName);
        return res.status(201).json({
          isSuccess: false,
          message: "Please enter valid Group name"
        });
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
          logger.error(err);
          let errorMessage = "Something went wrong.Please try again";
          if (
            err.errmsg !== undefined &&
            err.errmsg.includes("duplicate key error")
          )
            errorMessage = "Group with same name already exists";
          res.status(201).json({
            isSuccess: false,
            message: errorMessage
          });
          deleteFile(fileName);
        });
    });
  } else {
    res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
});

router.get("/", function (req, res) {
  let userID = 0;
  if (req.query.userID !== undefined) {
    userID = getUserIdFromToken(req.query.userID);
  }
  const url = req.protocol + "://" + req.get("host") + "/";
  Group.find({}, function (err, groups) {
    var groupsMap = [];
    groups.forEach(function (group) {
      if (group.imagePath !== "") group.imagePath = url + group.imagePath;
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

router.put("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID === 0) {
    return res.status(201).json({
      isSuccess: false,
      message: "Session expired.Please login again."
    });
  }
  upload(req, res, function (err) {
    if (err) {
      logger.error(err);
      let error = "Something went wrong.Please try again";
      if (err.code === "LIMIT_FILE_SIZE")
        error = "Please select image less than 200kb";
      else if (err.message === "Invalid mime type")
        error = "Please select valid image(JPG/JPEG/PNG)";
      return res.status(201).json({
        isSuccess: false,
        message: error
      });
    }

    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.filename;
    }
    if (!validateName(req.body.groupName)) {
      deleteFile(fileName);
      return res.status(201).json({
        isSuccess: false,
        message: "Please enter valid Group name"
      });
    }
    Group.findById(req.query.groupID, function (err, group) {
      if (err) {
        logger.error(err);
        res.status(201).json({
          isSuccess: false,
          message: "Group not exists"
        });
        deleteFile(fileName);
      } else {
        if (group.user === userID) {
          let previousFile = "";
          if (fileName === "" && req.body.imageURL !== "") {
          }
          else {
            previousFile = group.imagePath;
            group.imagePath = fileName;
          }
          group.groupName = req.body.groupName;
          group
            .save()
            .then(data => {
              deleteFile(previousFile);
              res.status(201).json({
                isSuccess: false,
                message: "Group updated"
              });
            })
            .catch(err => {
              logger.error(err);
              let errorMessage = "Something went wrong.Please try again";
              if (
                err.errmsg !== undefined &&
                err.errmsg.includes("duplicate key error")
              )
                errorMessage = "Group with same name already exists";
              res.status(201).json({
                isSuccess: false,
                message: errorMessage
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

//Get Group for Edit
router.get("/group", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    Group.findById({ _id: req.query.groupID }, function (err, group) {
      if (err) {
        logger.error(err);
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
          if (group.imagePath !== "") {
            const url = req.protocol + "://" + req.get("host") + "/";
            group.imagePath = url + group.imagePath;
          }
          res.status(201).json({
            isSuccess: true,
            group: group
          });
        }
      }
    });
  }
});

router.delete("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    Group.findOneAndDelete({ _id: req.query.groupID, user: userID }, function (
      err,
      group
    ) {
      if (err) {
        logger.error(err);
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
  if (fileName !== undefined) {
    let filePath = path.join(__dirname, "../public/groups/", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err)
          logger.error(err);
      });
    } else {
      logger.error("file not found " + filePath);
    }
  }
};


module.exports = router;
