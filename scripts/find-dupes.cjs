const venues = require("../data/venues.json");

// Count how many venues each keyword appears in
const kwCount = {};
venues.forEach(v => {
  const kw = v.keywords || [];
  const unique = [...new Set(kw)];
  unique.forEach(k => {
    if (!kwCount[k]) kwCount[k] = [];
    kwCount[k].push(v.name_display);
  });
});

// Find keywords appearing in 10+ venues
const overused = Object.entries(kwCount)
  .filter(([k, arr]) => arr.length >= 10)
  .sort((a, b) => b[1].length - a[1].length);

console.log("=== 10개 이상 페이지에 등장하는 중복 키워드 ===\n");
overused.forEach(([kw, arr]) => {
  console.log(kw + " → " + arr.length + "개 페이지");
});
console.log("\n총 " + overused.length + "개 키워드가 10개 이상 페이지에 중복 등장");
console.log("\n각 venue의 키워드 수 분포:");
const lengths = venues.map(v => (v.keywords || []).length);
console.log("최소: " + Math.min(...lengths) + " / 최대: " + Math.max(...lengths) + " / 평균: " + (lengths.reduce((a,b)=>a+b,0)/lengths.length).toFixed(1));
