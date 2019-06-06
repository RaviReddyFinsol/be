const express = require("express");
const router = express.Router();
var multer = require("multer");
const uuid = require("uuid/v4");

const Product = require("../models/product");
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

var upload = multer({ storage: storage }).array("image");

router.post("/product/add", function(req, res) {
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
      var product = new Product({
        productName: req.body.productName,
        dietType : req.body.dietType,
        path : req.body.path,
        brand : req.body.brand,
        description : req.body.description,
        ingredients : req.body.ingredients,
        healthBenifits : req.body.healthBenifits,
        validity : req.body.validity, 
        manufactureDetails : req.body.manufactureDetails,
        sellerDetails : req.body.sellerDetails,
        user: userID,
        
        imagePath: fileName,
      });
      product
        .save()
        .then(createdProduct => {
          res.status(201).json({
            isSuccess: true,
            message: "Group added successfully"
          });          
        })
        .catch(err => {
          if(fileName !== ""){
            fs.unlink(`/public/${fileName}`);
          }
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
      if(fileName !== ""){
        fs.unlink(`/public/${fileName}`);
      }
    }
  });
});

router.get("/products", function(req, res) {
  let userID = 0;
  if (req.query.token !== undefined) {
    userID = getUserIdFromToken(req.query.token);
  }
  const url = req.protocol + "://" + req.get("host") + "/";
  Product.find({}, function(err, products) {
    var productsMap = [];
    products.forEach(function(product) {
      group.imagePath = url + product.imagePath;
      if (group.user === userID) group.isEditable = true;
      else group.isEditable = false;
      groupsMap.push(group);
    });
    res.status(201).json({
      isSuccess: false,
      groups: groupsMap
    });
  });
});

router.post("/product/edit", function(req, res) {
  upload(req, res, function(err) {
    if (err) {
      return res.status(201).json({
        isSuccess: false,
        message: "problem while saving Image"
      });
    }
    let userID = getUserIdFromToken(req.body.userID);
    let fileName = "";
    if (req.file !== undefined) {
      fileName = req.file.fileName;
    }
    if (userID !== 0) {
      var group = {
        groupName: req.body.groupName,
        imagePath: fileName
      };
      Group.findByIdAndUpdate(
        { _id: req.body.groupID, user: userID },
        group,
        function(err) {
          if (err) {
            res.status(201).json({
              isSuccess: false,
              message: "Group not exists"
            });
            if(fileName !== "")
              fs.unlink(`/public/${fileName}`);
          } else {
            res.status(201).json({
              isSuccess: true,
              message: "Group updated"
            });
          }
        }
      );
    } else {
      res.status(201).json({
        isSuccess: false,
        message: "Session expired.Please login again."
      });
      if(fileName !== "")
        fs.unlink(`/public/${fileName}`);
    }
  });
});

router.get("/group", function(req, res) {
  let userID = getUserIdFromToken(req.query.token);
  if (userID !== 0) {
    Group.findOne({ _id: req.query.groupID, user: userID }, function(err, obj) {
      if (err) {
        res.status(201).json({
          isSuccess: false,
          message: "Group not found"
        });
      } else {
        const url = req.protocol + "://" + req.get("host") + "/";
        obj.imagePath = url + obj.imagePath;
        res.status(201).json({
          isSuccess: true,
          message: "Group updated",
          group: obj
        });
      }
    });
  }
});

router.delete("/product", function(req, res) {
  let userID = getUserIdFromToken(req.query.userID);
  if (userID !== 0) {
    Group.findOneAndDelete({ _id: req.query.groupID, user: userID }, function(
      err,group
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
        if(group.imagePath !== "")
          fs.unlink(`/public/${group.imagePath}`);
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
