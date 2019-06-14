const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const ChildGroup = require("../models/childGroup");
const { getUserIdFromToken } = require("../auth/token");

const fs = require("fs");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/childGroups");
  },
  filename: function (req, file, cb) {
    var id = uuid();
    let imgType = file.mimetype.substring(file.mimetype.indexOf("/") + 1);
    cb(null, id + "." + imgType);
  }
});

var upload = multer({ storage: storage,limits: { fileSize: 200000 } }).single("image");

router.post("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    upload(req, res, function (err) {
      if (err) {
        let error = "Something went wrong.Please try again"
        if (err.code === "LIMIT_FILE_SIZE")
          error = "Please select image less than 200kb"
        return res
          .status(201)
          .json({ isSuccess: false, message: error });
      }
      let fileName = "";
      if (req.file !== undefined) {
        fileName = req.file.filename;
      }
      var childGroup = new ChildGroup({
        childGroupName: req.body.childGroupName,
        subGroup: req.body.subGroup,
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
          let errorMessage = "Something went wrong.Please try again"
          if (err.errors !== undefined)
            errorMessage = "Please select valid SubGroup"
          else if (err.errmsg.includes("duplicate key error"))
            errorMessage = "ChildGroup with same name already exists"
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
  ChildGroup.find().populate('subGroup').exec(function (err, childGroups) {
    var childGroupsMap = [];
    if (childGroups) {
      childGroups.forEach(function (childGroup) {
        if (childGroup.imagePath !== "")
          childGroup.imagePath = url + childGroup.imagePath;
        if (childGroup.user === userID) childGroup.isEditable = true;
        else childGroup.isEditable = false;
        childGroup.subGroupName = childGroup.subGroup.subGroupName;
        childGroupsMap.push(childGroup);
      });
      res.status(201).json({
        isSuccess: true,
        childGroups: childGroupsMap
      });
    }
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
      let error = "Something went wrong.Please try again"
        if (err.code === "LIMIT_FILE_SIZE")
          error = "Please select image less than 200kb"
      return res.status(201).json({
        isSuccess: false,
        message: error
      });
    }

    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.filename;
    }
    ChildGroup.findById(req.query.childGroupID, function (err, childGroup) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "ChildGroup not exists"
        });
        deleteFile(fileName);
      } else {
        if (childGroup.user === userID) {
          const previousFile = childGroup.imagePath;
          childGroup.imagePath = fileName;
          childGroup.subGroup = req.body.subGroup;
          childGroup.childGroupName = req.body.childGroupName;
          childGroup
            .save()
            .then(data => {
              res.status(201).json({
                isSuccess: true,
                message: "ChildGroup updated"
              });
              deleteFile(previousFile);
            })
            .catch(err => {
              let errorMessage = "Something went wrong.Please try again"
              if (err.errors !== undefined)
                errorMessage = "Please select valid SubGroup"
              else if (err.errmsg.includes("duplicate key error"))
                errorMessage = "ChildGroup with same name already exists"
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

//Get ChildGroup for Edit
router.get("/childGroup", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {

    ChildGroup.findById(req.query.childGroupID, function (err, childGroup) {
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
          if (childGroup.imagePath !== "") {
            const url = req.protocol + "://" + req.get("host") + "/";
            childGroup.imagePath = url + childGroup.imagePath;
          }
          res.status(201).json({
            isSuccess: true,
            childGroup: childGroup
          });
        }
      }
    });
  }
});

router.delete("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    ChildGroup.findOneAndDelete(
      { _id: req.query.childGroupID, user: userID },
      function (err, childGroup) {
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

const deleteFile = fileName => {
  if (fileName !== undefined) {
    let filePath = "/public/childGroups/" + fileName;
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath);
    } else {
      console.log("File not found " + filePath);
    }
  }
};

module.exports = router;
