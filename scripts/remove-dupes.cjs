const fs = require("fs");
const venues = require("../data/venues.json");

// Count keyword frequency across venues
const kwCount = {};
venues.forEach(v => {
  const unique = [...new Set(v.keywords || [])];
  unique.forEach(k => {
    kwCount[k] = (kwCount[k] || 0) + 1;
  });
});

// Keywords appearing in 10+ venues
const overused = new Set(
  Object.entries(kwCount)
    .filter(([k, count]) => count >= 10)
    .map(([k]) => k)
);

console.log("삭제 대상 키워드 (" + overused.size + "개):");
console.log([...overused].join(", "));
console.log("");

let totalRemoved = 0;
let emptyCount = 0;
const report = [];

venues.forEach(v => {
  const orig = v.keywords || [];
  const filtered = orig.filter(k => !overused.has(k));
  const removed = orig.length - filtered.length;
  if (removed > 0) {
    const removedKws = orig.filter(k => overused.has(k));
    report.push(v.name_display + " | 삭제:" + removed + "개 (" + removedKws.join(", ") + ") | 남은:" + filtered.length + "개" + (filtered.length > 0 ? " [" + filtered.join(", ") + "]" : " [없음]"));
    totalRemoved += removed;
    if (filtered.length === 0) emptyCount++;
    v.keywords = filtered;
  }
});

console.log("=== 삭제 보고서 ===\n");
report.forEach(r => console.log(r));
console.log("\n총 삭제: " + totalRemoved + "개 키워드");
console.log("키워드 0개가 된 venue: " + emptyCount + "개");

// Save
fs.writeFileSync("./data/venues.json", JSON.stringify(venues, null, 2), "utf8");
console.log("\nvenues.json 저장 완료");
