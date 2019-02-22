workflow "Publish on version tag" {
  on = "push"
  resolves = ["npm publish"]
}

action "On version tag" {
  uses = "actions/bin/filter@46ffca7632504e61db2d4cb16be1e80f333cb859"
  args = "tag v*"
}

action "npm publish" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["On version tag", "On master"]
  args = "publish --access public"
  secrets = ["NPM_AUTH_TOKEN"]
}

workflow "Test on Push" {
  on = "push"
  resolves = [
    "npm test only",
    "run npm ci",
  ]
}

action "npm test only" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  needs = ["run npm ci"]
  args = "run test"
}

action "On master" {
  uses = "actions/bin/filter@46ffca7632504e61db2d4cb16be1e80f333cb859"
  args = "branch master"
}

action "run npm ci" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "ci"
}
