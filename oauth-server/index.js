const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

//
app.get("/", (req, res) => {
  res.send(`<h1>Welcome to the OAuth API Server........</h1>`);
});

// github oauth api routh
app.get("/auth/github", (req, res) => {
  try {
    // github oauth url
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;
    console.log("Redirecting to:", githubAuthURL);

    res.redirect(githubAuthURL); // redirect to github auth page
  } catch (error) {
    console.error("Error setting GitHub auth URL:", error);
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
    console.log(tokenResponse);

    const accessToken = tokenResponse.data.access_token; // get the access token from the response
    console.log(accessToken);

    res.cookie("access_token", accessToken); // set the access token as a cookie

    return res.redirect(`${process.env.FRONTEND_URL}/v1/profile/github`); // redirect to frontend profile page

  } catch (error) {
    res.status(500).json({ message: error.message }); // error handling
  }
});

// listening incoming request from all endpoints
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
