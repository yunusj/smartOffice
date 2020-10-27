// Copyright 2018, Google LLC.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

const express = require("express");
const bodyParser = require('body-parser')
const assistantApi = require("./google-assistant");

const app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var validate = function(req, res, next) {
  let password, 
  isSlackCommand = false;
  if (req.query && req.query.password) {
    console.log("Received req.query.password: ", req.query.password);
    password = req.query.password;
  }

  if (req.body && req.body.user_id) {
    console.log("Request by slack", req.body);
    req.data = {
      user_id: req.body.user_id
    };
    isSlackCommand = true;
  }

  if(isSlackCommand || ['atompoint'].includes(password)) {
    next();
  } else {
    res.status(200).send("Incorrect credentials!");
    return false;
  }
};

var unlockDoor = function(req, res, next) {
  let user = "atompoint";
  let commandContext = "door lock";

  console.log("unlockDoor called");
  // res.status(200).send("unlockDoor called");
  // return;

  assistantApi
    .sendTextInput("turn on " + commandContext, user, false)
    .then(response => {
      // res.status(200).json(response);
      console.log("Door lock OPENED", "turn on " + commandContext, response);
      // const user_name = req.data && req.data.user_id ? req.data.user_id : '';
      res.status(200).send( "Door unlocked!" );
      //res.status(200).send( JSON.stringify(req) );

      setTimeout(() => {
        assistantApi
          .sendTextInput("turn off " + commandContext, user, false)
          .then(response => {
            console.log("Door lock CLOSED", "turn off " + commandContext, response);
            res.end();
            next();
          });
      }, 300);
    })
    .catch(err => {
      console.log("Doorlock failed Error", err);
      res.status(400).json(err);
      next();
    });
};

// [START hello_world]
// Say hello!
app.get("/", (req, res) => {
  res.status(200).send("In search for code of life...");
});
// [END hello_world]

app.get(
  "/door-lock",
  validate,
  unlockDoor,
);

app.post(
  "/door-lock",
  validate,
  unlockDoor,
);

if (module === require.main) {
  // [START server]
  // Start the server
  const server = app.listen(process.env.PORT || 5000, () => {
    const port = server.address().port;
    console.log(`App listening on port ${port}`);
  });
  // [END server]
}

module.exports = app;
