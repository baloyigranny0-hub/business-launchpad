const fs = require("fs");
const path = require("path");

const staticDir = path.join(__dirname, "..", "build", "static");

function removeMaps(dir) {
  if (!fs.existsSync(dir)) return 0;
  let removed = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removed += removeMaps(fullPath);
    } else if (entry.isFile() && entry.name.endsWith(".map")) {
      fs.rmSync(fullPath);
      removed += 1;
    } else if (entry.isFile() && /\.(js|css)$/.test(entry.name)) {
      const original = fs.readFileSync(fullPath, "utf8");
      const cleaned = original
        .replace(/\n?\/\/# sourceMappingURL=.*\.map\s*$/gm, "")
        .replace(/\n?\/\*# sourceMappingURL=.*\.map\s*\*\/\s*$/gm, "");
      if (cleaned !== original) fs.writeFileSync(fullPath, cleaned);
    }
  }
  return removed;
}

const count = removeMaps(staticDir);
console.log(`Removed ${count} source map file${count === 1 ? "" : "s"} from build output.`);
