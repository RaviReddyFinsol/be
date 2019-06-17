const express = require("express");
const router = express.Router();
const Groups = require("../models/group");
const SubGroups = require("../models/subGroup");
const ChildGroups = require("../models/childGroup");
const Products = require("../models/product");
const logger = require("../logger/log4js");

router.get("/groups", function(req, res) {
  Groups.find({}, function(err, groups) {
    if(err)
    {
      logger.error(err);
      return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"});
    }
    res.status(201).json({
      isSuccess: true,
      groups: groups
    });
  });
});

router.get("/subGroups", function(req, res) {
  if(req.query.groupID === undefined){
 SubGroups.find({}, function(err, subGroups) {
  if(err)
  {
    logger.error(err);
    return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"});
  }
    res.status(201).json({
      isSuccess: true,
      subGroups: subGroups
    });
  });
}
else{
  SubGroups.find({_id : req.query.groupID}, function(err, subGroups) {
    if(err)
      {
        logger.error(err);
        return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"});
      }
    res.status(201).json({
      isSuccess: true,
      subGroups: subGroups
    });
  });
}
});

router.get("/childGroups", function(req, res) {
  if(req.query.subGroupID === undefined)
  {
  ChildGroups.find({}, function(err, childGroups) {
    if(err)
      {
        logger.error(err);
        return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"});
      }
    res.status(201).json({
      isSuccess: true,
      childGroups: childGroups
    });
  });
}
else{
  ChildGroups.find({_id : subGroupID}, function(err, childGroups) {
    if(err)
   {
    logger.error(err);
     return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"});
   } 
    res.status(201).json({
      isSuccess: true,
      childGroups: childGroups
    });
  });
}
});

router.get("/products", function(req, res) {
  Products.find({}, function(err, products) {
    if(err)
    {
      logger.error(err);
      return res.status(201).json({isSuccess : false, message : "something went wrong.Please try again"})
    }
    else
    {
    res.status(201).json({
      isSuccess: true,
      products: products
    });
  }
  });
});

module.exports = router;
