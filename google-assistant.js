const path = require("path");
const GoogleAssistant = require("google-assistant");
const config = {
  auth: {
    keyFilePath: path.resolve(__dirname, "secrets/client_secret.json"),
    // where you want the tokens to be saved
    // will create the directory if not already there
    savedTokensPath: path.resolve(__dirname, "tokens/atompoint-tokens.json")
  },
  // this param is optional, but all options will be shown
  conversation: {
    language: "en-US",
    audio: {
      sampleRateOut: 24000,
      sampleRateIn: 24000
    }
  }
};

const assistant = new GoogleAssistant(config.auth);

// starts a new conversation with the assistant
const startConversation = conversation => {
  // setup the conversation and send data to it
  // for a full example, see `examples/mic-speaker.js`

  conversation
    .on("audio-data", data => {
      // do stuff with the audio data from the server
      // usually send it to some audio output / file
    })
    .on("end-of-utterance", () => {
      // do stuff when done speaking to the assistant
      // usually just stop your audio input
    })
    .on("transcription", data => {
      // do stuff with the words you are saying to the assistant
    })
    .on("response", text => {
      // do stuff with the text that the assistant said back
    })
    .on("volume-percent", percent => {
      // do stuff with a volume percent change (range from 1-100)
    })
    .on("device-action", action => {
      // if you've set this device up to handle actions, you'll get that here
    })
    .on("screen-data", screen => {
      // if the screen.isOn flag was set to true, you'll get the format and data of the output
    })
    .on("ended", (error, continueConversation) => {
      // once the conversation is ended, see if we need to follow up
      if (error) console.log("Conversation Ended Error:", error);
      else if (continueConversation) assistant.start();
      else console.log("Conversation Complete");
    })
    .on("error", error => console.error(error));
};

// will start a conversation and wait for audio data
// as soon as it's ready
assistant
  .on("ready", () => {
    console.log("ASSISTANT READY");
  })
  .on("started", () => {
    console.log("ASSISTANT STARTED");
  })
  .on("error", error => console.error("Assistant init error", error));

module.exports = {
  startConversation: function(conversation) {
    let response = {};
    return new Promise((resolve, reject) => {
      // conversation.write(file)
      conversation
        .on("audio-data", data => {})
        .on("response", text => {
          if (text) {
            response.response = text;
          }
        })
        .on("end-of-utterance", () => {
          console.log("Done speaking");
        })
        .on("transcription", data => {
          console.log(data);
        })
        .on("volume-percent", percent => {
          console.log(`Volume has been set to ${percent} \n`);
          response.volume = `New Volume Percent is ${percent}`;
        })
        .on("device-action", action => {
          console.log(`Device Action: ${action} \n`);
          response.action = `Device Action is ${action}`;
        })
        .on("ended", (error, continueConversation) => {
          if (error) {
            console.log("Conversation Ended Error:", error);
            response.success = false;
            reject(response);
          } else if (continueConversation) {
            response.success = true;
            console.log("Continue the conversation... somehow \n");
            conversation.end();
            resolve();
          } else {
            response.success = true;
            console.log("Conversation Complete \n");
            //self.joinAudio();
            conversation.end();

            resolve(response);
          }
        })
        .on("error", error => {
          console.log(`Something went wrong: ${error}`);
          response.success = false;
          response.error = error;
          reject(response);
        });
    });
  },
  sendTextInput: function(text, n, converse) {
    return new Promise((resolve, reject) => {
      console.log(`Received command ${text} \n`);
      // set the conversation query to text
      config.conversation.textQuery = text;
      
      // @experiement implementation disabled
      // const assistant = new GoogleAssistant(config.auth);
      // assistant.on('ready', () => assistant.start(config.conversation)).on('started', startConversation);

      assistant.start(config.conversation, conversation => {
        return module.exports
          .startConversation(conversation)
          .then(data => {
            resolve(data);
          })
          .catch(err => {
            reject(err);
          });
      });
    });
  }
};
