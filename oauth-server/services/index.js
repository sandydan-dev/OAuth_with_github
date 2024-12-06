// helper function

function setSecureCookie(res, token) {
  res.cookie("access_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 1000,
    // secure: true,
    // sameSite: 'strict',
  });

  return res;
}

module.exports = { setSecureCookie };
