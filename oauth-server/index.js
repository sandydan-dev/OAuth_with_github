const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 4000;
const cookieParser = require("cookie-parser");

// cookie helper function
const { setSecureCookie } = require("./services/index");
const { verifiyAccessToken } = require("./middleware/index");

app.use(cors({ credentials: true, origin : process.env.FRONTEND_URL }));
app.use(cookieParser()); // parse cookies reading while get sessions
app.use(express.json());

//
app.get("/", (req, res) => {
  res.send(`<h1>Welcome to the OAuth API Server........</h1>`);
});

// GITHUB OAUTH AUTHENTICATION

// writing protected route for github
app.get("/user/profile/github", verifiyAccessToken, async (req, res) => {
  try {
    const { access_token } = req.cookies;
    const githubDataResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    res.json({ message: githubDataResponse.data });
  } catch (error) {
    res.status(500).json({ message: "didn't get user profile from github" });
  }
});

// github oauth api routh
app.get("/auth/github", (req, res) => {
  try {
    // github oauth url
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
    // console.log("Redirecting to:", githubAuthURL);

    res.redirect(githubAuthURL); // redirect to github auth page
  } catch (error) {
    // console.error("Error setting GitHub auth URL:", error);
    res
      .status(500)
      .send(`An error occurred while setting up GitHub auth: ${error.message}`);
  }
});

// access token api routh
app.get("/auth/github/callback", async (req, res) => {
  // callback url
  const { code } = req.query; // get the code from the query string
  try {
    const tokenResponse = await axios.post(
      `https://github.com/login/oauth/access_token`, // access token url
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code, // code from the query string
      },
      { headers: { Accept: "application/json" } } // headers
    );
    // console.log(tokenResponse);

    const accessToken = tokenResponse.data.access_token; // get the access token from the response
    // console.log(accessToken);

    // res.cookie("access_token", accessToken); // set the access token as a cookie
    // instead of uesing cookie we will use session
    setSecureCookie(res, accessToken);

    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/github`); // redirect to frontend profile page
  } catch (error) {
    res.status(500).json({ message: error.message }); // error handling
  }
});

// GOOGLE OAUTH AUTHENTICATION ENDPOINT

// writing protected route for google api
app.get("/user/profile/google", verifiyAccessToken, async (req, res) => {
  try {
    const { access_token } = req.cookies;
    const googleAuthURL = `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${access_token}`;
    const response = await axios.get(googleAuthURL, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    // console.log(response.data);
    res.json(response.data);
  } catch (error) {
    // console.error("Error setting Google auth URL:", error);
    res
      .status(500)
      .send(`An error occurred while setting up Google auth: ${error.message}`);
  }
});

// google auth url (temparory)
app.get("/auth/google", (req, res) => {
  const googleAuthURL = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:${PORT}/auth/google/callback&response_type=code&scope=profile email`;

  // console.log("Google Authentication ", googleAuthURL);

  res.redirect(googleAuthURL);
});

// google access token api routh
app.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query; // get the code from the query string
  if (!code) {
    return res.status(404).send("Authorization code not found");
  }

  let accessToken;

  try {
    const tokenResponse = await axios.post(
      `https://oauth2.googleapis.com/token`,
      {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: `http://localhost:${PORT}/auth/google/callback`,
      },
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } } // headers
    );
    // console.log(tokenResponse);

    accessToken = tokenResponse.data.access_token;

    // res.cookie("access_token", accessToken); // set the access token as a cookie
    // instead of using cookie we will use session
    setSecureCookie(res, accessToken);

    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`); // redirect
  } catch (error) {
    res.status(500).json({ message: error.message }); // error handling
  }
});

// listening incoming request from all endpoints
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
