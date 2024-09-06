const fs = require("fs");
const path = require("path");

async function getReleaseLine(changeset, type) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf-8");
  const releases = changelog.split("\n## ");
  const latestRelease = releases[1]; // The first entry after the split is the header, so we take the second one
  const releaseNotes = latestRelease.split("\n").slice(1).join("\n").trim();
  return releaseNotes;
}

async function getDependencyReleaseLine(changesets, dependenciesUpdated) {
  return dependenciesUpdated.length > 0
    ? `Dependency Updates: ${dependenciesUpdated.join(", ")}`
    : "";
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
