const fs = require("fs");
const path = require("path");

const packageJson = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "packages", "nc-lib-gui", "package.json"),
    "utf8"
  )
);

packageJson.name = `@tencent/${packageJson.name}-vb`;
packageJson.version = process.env.targetVersion;
fs.writeFileSync(
  path.join(__dirname, "..", "packages", "nc-lib-gui", "package.json"),
  JSON.stringify(packageJson, 0, 2)
);
