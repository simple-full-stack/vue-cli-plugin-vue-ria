const mockup = require('../utils').mockup;

module.exports = function (req, res) {
  mockup.ok(req, res, {
    visitor: {
      auth: {}
    }
  });
};
