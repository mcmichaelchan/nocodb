const fs = require("fs");
const path = require("path");

const nocodbPackageFilePath = path.join(
  __dirname,
  "..",
  "packages",
  "nocodb",
  "package.json"
);

const packageJson = JSON.parse(fs.readFileSync(nocodbPackageFilePath, "utf8"));

nocoLibPackage.dependencies["nocodb-sdk"] = process.env.latestVersion;

fs.writeFileSync(
  nocodbPackageFilePath,
  JSON.stringify(nocoLibPackage, null, 2)
);
