const app = require("./app");
const debug = require("debug")("node-react");
const http = require("http");
const { port } = require("./config");
console.log("start", port);
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === "string" ? "pipe " + addr : "port " + port;
  debug("Listening on " + bind);
};

app.set("port", port);
const server = http.createServer(app);
server.on("listening", onListening);
server.listen(port);
