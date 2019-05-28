const jwt = require("jsonwebtoken");
const { secretKey } = require("../config");

var generateToken = UserID => {
  var token = jwt.sign({ userID: UserID }, secretKey, {
    expiresIn: 21600 // expires in 6 hours
  });
  return token;
};

var getUserNameFromToken = token => {
  jwt.verify(token, secretKey, function(err, decoded) {
    if (err) return "";
    return decoded.userID;
  });
};

module.exports = {
  generateToken,
  getUserNameFromToken
};
