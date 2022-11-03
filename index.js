const core = require('@actions/core');
const github = require('@actions/github');

try {
  const desc = core.getInput('desc');
  console.log(`Received ${desc}!`);
  const result = "NOT OK"
  var descParts = desc.split('\n');
  core.setOutput("result", result);
} catch (error) {
  core.setFailed(error.message);
}
