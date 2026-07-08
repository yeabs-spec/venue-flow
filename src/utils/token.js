const jwt = require("jsonwebtoken");

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "change-this-secret",
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h"
    }
  );
}

module.exports = {
  signToken
};
