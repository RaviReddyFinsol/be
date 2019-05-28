const dotenv = require("dotenv");
dotenv.config();
module.exports = {
  port: process.env.PORT,
  dbConnection: process.env.DB_CONNECTION,
  secretKey: process.env.SECRET_KEY
};
