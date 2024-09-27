const fs = require("fs");
const path = require("path");

async function getReleaseLine(changeset, type) {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const changelog = fs.readFileSync(changelogPath, "utf-8");

  // 查找 [unreleased] 部分
  const unreleasedRegex =
    /## \[unreleased\]\s*([\s\S]*?)(?=\n### \[\d+\.\d+\.\d+\]|$)/i;
  const match = changelog.match(unreleasedRegex);

  if (!match) {
    return "无法找到未发布的更新内容";
  }

  let unreleasedContent = match[1].trim();

  // 如果未发布内容为空,返回空字符串
  if (!unreleasedContent) {
    return "";
  }

  // 格式化未发布内容
  const formattedContent = unreleasedContent
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => (line.startsWith("###") ? line : `- ${line.trim()}`))
    .join("\n");

  return formattedContent;
}

async function getDependencyReleaseLine(changesets, dependenciesUpdated) {
  return dependenciesUpdated.length > 0
    ? `依赖更新: ${dependenciesUpdated.join(", ")}`
    : "";
}

module.exports = {
  getReleaseLine,
  getDependencyReleaseLine,
};
