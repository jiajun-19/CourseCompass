conconst importedApp = require("./src/server.js");
const app = importedApp.default || importedApp;

function handler(req, res) {
    return app(req, res);
}

module.exports = handler;
module.exports.default = handler;
