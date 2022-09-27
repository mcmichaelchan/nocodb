const fs = require("fs");
const path = require("path");

const nocodbPackageFilePath = path.join(
  __dirname,
  "..",
  "packages",
  "nocodb",
  "package.json"
);
const nocoLibPackage = JSON.parse(fs.readFileSync(nocodbPackageFilePath));
