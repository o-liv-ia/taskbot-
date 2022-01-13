import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const creds = require("./creds.json") // use the require method

import fetch from 'node-fetch';
//import creds from './creds.json';

async function getIssueCount(fetch) {
  //context.sendActivity(data.text())
  //console.log(data)
  const response = await fetch('https://badgerloop.atlassian.net/rest/api/2/search?jql=project=EL%20AND%20(status=%27To%20Do%27%20OR%20status%20=%20%27In%20Progress%27)',{
    method: 'GET',
    //body: data,
    host:"badgerloop.atlassian.net",
    port: 443,
    path: creds.jiraPath,
    headers: {
              "Authorization": "Basic " + new Buffer.from(creds.jiraEmail + ":" + creds.jiraAPIToken).toString("base64"),
              "Content-Type": "application/json"}
    }
  )

  let json = await response.json();
  console.log(json)
  
  return json
}

async function main() {
    let data = await getIssueCount(fetch);
}

main();
