function verifiyAccessToken(req, res, next) {
  if (!req.cookies.access_token) {
    return res.status(403).json({ message: "Access token is required." });
  }

  next();
}

module.exports = { verifiyAccessToken };
