const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");
const logger = require("../logger/log4js");

const Product = require("../models/product");
const { getUserIdFromToken } = require("../auth/token");
var path = require('path');
const fs = require("fs");
const validateName = require("../shared/methods");

const mimeType = require("../shared/dictionaries");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = mimeType[file.mimetype];
    let error = new Error("Invalid mime type");
    if (isValid) {
      error = null;
    }
    cb(error, "public/products");
  },
  filename: function (req, file, cb) {
    var id = uuid();
    const extension = mimeType[file.mimetype];
    cb(null, id + "." + extension);
  }
});

var upload = multer({ storage: storage, limits: { fileSize: 200000 } }).array(
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
      if (!validateName(req.body.group)) {
        deleteFile(fileName);
        return res.status(201).json({
          isSuccess: false,
          message: "Please select valid Group"
        });
      }
      if (!validateName(req.body.subGroupName)) {
        deleteFile(fileName);
        return res.status(201).json({
          isSuccess: false,
          message: "Please enter valid Sub Group name"
        });
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
          logger.error(err);
          let errorMessage = "Something went wrong.Please try again";
          if (err.errors !== undefined)
            errorMessage = "Please select valid Group";
          else if (
            err.errmsg !== undefined &&
            err.errmsg.includes("duplicate key error")
          )
            errorMessage = "SubGroup with same name already exists";
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
  SubGroup.find()
    .populate("group")
    .exec(function (err, subGroups) {
      logger.error(err);
      var subGroupsMap = [];
      if (subGroups) {
        subGroups.forEach(function (subGroup) {
          if (subGroup.imagePath != "")
            subGroup.imagePath = url + subGroup.imagePath;
          if (subGroup.user === userID) subGroup.isEditable = true;
          else subGroup.isEditable = false;
          if (subGroup.group)
            subGroup.groupName = subGroup.group.groupName;
          subGroupsMap.push(subGroup);
        });
        res.status(201).json({
          isSuccess: true,
          subGroups: subGroupsMap
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
    if (!validateName(req.body.group)) {
      deleteFile(fileName);
      return res.status(201).json({
        isSuccess: false,
        message: "Please select valid Group"
      });
    }
    if (!validateName(req.body.subGroupName)) {
      deleteFile(fileName);
      return res.status(201).json({
        isSuccess: false,
        message: "Please select valid Sub Group name"
      });
    }
    SubGroup.findById(req.query.subGroupID, function (err, subGroup) {
      if (err) {
        logger.error(err);
        res.status(201).json({
          isSuccess: false,
          message: "SubGroup not exists"
        });
        deleteFile(fileName);
      } else {
        if (subGroup.user === userID) {
          let previousFile = "";
          if (fileName === "" && req.body.imageURL !== "") {
          }
          else {
            previousFile = subGroup.imagePath;
            subGroup.imagePath = fileName;
          }
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
              logger.error(err);
              let errorMessage = "Something went wrong.Please try again";
              if (err.errors !== undefined)
                errorMessage = "Please select valid Group";
              else if (err.errmsg !== undefined && err.errmsg.includes("duplicate key error"))
                errorMessage = "SubGroup with same name already exists";
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

//Get SubGroup for Edit
router.get("/subGroup", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    SubGroup.findById({ _id: req.query.subGroupID })
    .populate("group")
    .exec(function (err, subGroup) {
      if (err) {
        logger.error(err);
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
          if (subGroup.imagePath !== "") {
            const url = req.protocol + "://" + req.get("host") + "/";
            subGroup.imagePath = url + subGroup.imagePath;
          }
          if (!subGroup.group)
          subGroup.groupName = "";
          res.status(201).json({
            isSuccess: true,
            subGroup: subGroup
          });
        }
      }
    });
  }
});

router.delete("/", function (req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    SubGroup.findOneAndDelete(
      { _id: req.query.subGroupID, user: userID },
      function (err, subGroup) {
        if (err) {
          logger.error(err);
          res.status(201).json({
            isSuccess: false,
            message: "Something went wrong.Please try again"
          });
        } else {
          res.status(201).json({
            isSuccess: true,
            message: "Product deleted"
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
    let filePath = path.join(__dirname, "../public/products/", fileName);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err)
          logger.error(err);
      });
    } else {
      logger.error("file not found " + fileName);
    }
  }
};

module.exports = router;
