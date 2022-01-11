const { TeamsActivityHandler, CardFactory, TurnContext, ConsoleTranscriptLogger} = require("botbuilder");
const rawWelcomeCard = require("./adaptiveCards/welcome.json");
const rawLearnCard = require("./adaptiveCards/learn.json");
const cardTools = require("@microsoft/adaptivecards-tools");
const fetch = require("node-fetch");
//let MongoClient = require("mongodb").MongoClient;
let creds = require("./creds.json");

async function getIssueCount(url, data) {
  //context.sendActivity(data.text())
  console.log(data)
  const response = await fetch(url, {
    method: 'GET',
    //body: data,
    host:"https://badgerloop.atlassian.net",
    port: 443,
    path: creds.jiraPath,
    headers: {
              "Authorization": "Basic " + new Buffer.from(creds.jiraEmail + ":" + creds.jiraAPIToken).toString("base64"),
              "Content-Type": "application/json"}
    }
  )
  console.log(response)
  
  return response.text();
}


class TeamsBot extends TeamsActivityHandler {
  constructor() {
    super();

    // record the likeCount
    this.likeCountObj = { likeCount: 0 };

    this.onMessage(async (context, next) => {
      console.log("Running with Message Activity.");
      let txt = context.activity.text;
      const removedMentionText = TurnContext.removeRecipientMention(
        context.activity
      );
      if (removedMentionText) {
        // Remove the line break
        txt = removedMentionText.toLowerCase().replace(/\n|\r/g, "").trim();
      }

      // Trigger command by IM text
      switch (txt) {
        case "welcome": {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
        case "learn": {
          this.likeCountObj.likeCount = 0;
          const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }

        case "issue": {
          let apiresp = await getIssueCount('https://badgerloop.atlassian.net/rest/api/2/search?jql=project=EL%20AND%20(status=%27To%20Do%27%20OR%20status%20=%20%27In%20Progress%27)',{host:"https://badgerloop.atlassian.net",
          port: 443,
          path: creds.jiraPath,
          method: "GET",
          headers: {
              "Authorization": "Basic " + new Buffer.from(creds.jiraEmail + ":" + creds.jiraAPIToken).toString("base64"),
              "Content-Type": "application/json"}}
              );
          context.sendActivity(apiresp);
          break;

        }
        /**
         * case "yourCommand": {
         *   await context.sendActivity(`Add your response here!`);
         *   break;
         * 
         * // function that fills in webhook urls based on project
         * }
         */
      }

      // By calling next() you ensure that the next BotHandler is run.
      await next();
    });

    // Listen to MembersAdded event, view https://docs.microsoft.com/en-us/microsoftteams/platform/resources/bot-v3/bots-notifications for more events
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      for (let cnt = 0; cnt < membersAdded.length; cnt++) {
        if (membersAdded[cnt].id) {
          const card = cardTools.AdaptiveCards.declareWithoutData(rawWelcomeCard).render();
          await context.sendActivity({ attachments: [CardFactory.adaptiveCard(card)] });
          break;
        }
      }
      await next();
    });
  }

  // Invoked when an action is taken on an Adaptive Card. The Adaptive Card sends an event to the Bot and this
  // method handles that event.
  async onAdaptiveCardInvoke(context, invokeValue) {
    // The verb "userlike" is sent from the Adaptive Card defined in adaptiveCards/learn.json
    if (invokeValue.action.verb === "userlike") {
      this.likeCountObj.likeCount++;
      const card = cardTools.AdaptiveCards.declare(rawLearnCard).render(this.likeCountObj);
      await context.updateActivity({
        type: "message",
        id: context.activity.replyToId,
        attachments: [CardFactory.adaptiveCard(card)],
      });
      return { statusCode: 200 };
    }
  }

}


module.exports.TeamsBot = TeamsBot;
