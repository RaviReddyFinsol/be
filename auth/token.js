const jwt = require("jsonwebtoken");
const { secretKey } = require("../config");

var generateToken = UserID => {
  var token = jwt.sign({ userID: UserID }, secretKey, {
    expiresIn: 21600 // expires in 6 hours
  });
  return token;
};

var getUserIdFromToken = token => {
  let userID = 0;
  jwt.verify(token, secretKey, function(err, decoded) {
    if (err) userID = 0;
    else userID = decoded.userID;
  });
  return userID;
};

module.exports = {
  generateToken,
  getUserIdFromToken
};
