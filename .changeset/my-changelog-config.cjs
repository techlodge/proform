const fs = require("fs");
const path = require("path");

async function getReleaseLine(changeset, type) {
  const changelogPath = path.join(process.cwd(), "TEMP_CHANGELOG.md");

  // 检查文件是否存在，并且不是目录
  if (
    !fs.existsSync(changelogPath) ||
    fs.statSync(changelogPath).isDirectory()
  ) {
    console.error("TEMP_CHANGELOG.md 文件不存在或是一个目录");
    return "";
  }

  // 打印当前目录下所有文件
  const files = fs.readdirSync(process.cwd());
  console.log("process.cwd()", changelogPath);
  console.log("当前目录下所有文件:", files);

  let changelog;
  try {
    changelog = fs.readFileSync(changelogPath, "utf-8");
    console.log("读取到的 changelog:\n", changelog);
  } catch (error) {
    console.error("读取 TEMP_CHANGELOG.md 文件时出错:", error);
    return "";
  }

  // 按行分割 changelog
  const lines = changelog.split("\n");

  // 找到 [unreleased] 的索引
  const unreleasedIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === "## [unreleased]"
  );

  if (unreleasedIndex === -1) {
    console.log("未找到 [unreleased] 部分");
    return "";
  }

  // 找到下一个版本号的索引
  const nextVersionIndex = lines.findIndex(
    (line, index) =>
      index > unreleasedIndex && line.startsWith("## [") && line.includes("]")
  );

  // 如果没有找到下一个版本号,就取到文件末尾
  const endIndex = nextVersionIndex === -1 ? lines.length : nextVersionIndex;

  // 提取 [unreleased] 部分的内容
  const unreleasedContent = lines
    .slice(unreleasedIndex + 1, endIndex)
    .join("\n")
    .trim();

  if (!unreleasedContent) {
    console.log("[unreleased] 部分为空");
    return "";
  }

  console.log("提取的未发布内容:\n", unreleasedContent);
  return unreleasedContent;
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
