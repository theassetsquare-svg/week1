const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'data', 'venues.json');
const venues = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const pricePatterns = [
  // Remove entire FAQ items about 입장료/가격
  /의 입장료는 어느 정도인가요\?/,
  /의 음료 가격대가 궁금합니다/,
];

// Patterns to remove from text
const removePatterns = [
  /입장료\s*\+?\s*음료\s*\d+~?\d*잔\s*기준,?\s*\d+만~?\d*만\s*원이면\s*충분한?\s*[^\.\n]*/g,
  /\d+만\s*원대?부터\s*시작하며,?\s*[^\.]*\./g,
  /\d+~\d+만\s*원[대이]?[가는의]?\s*/g,
  /\d+만\s*원[대이]?[가는의에서]?\s*/g,
  /입장료가?\s*[^\.\,]*[다를수있]/g,
  /별도\s*가격이\s*적용됩니다\.?\s*/g,
  /가격[대이에]?\s*/g,
  /입장료[가는를]?\s*/g,
  /예산[을은이]?\s*/g,
];

let totalRemoved = 0;
let faqsRemoved = 0;

venues.forEach(venue => {
  // Clean FAQ items - remove ones about 입장료/가격
  if (venue.faq && Array.isArray(venue.faq)) {
    const before = venue.faq.length;
    venue.faq = venue.faq.filter(item => {
      const isPrice = pricePatterns.some(p => p.test(item.q));
      return !isPrice;
    });
    faqsRemoved += (before - venue.faq.length);
  }

  // Clean text fields
  const textFields = ['teaser', 'description', 'atmosphere', 'story', 'conclusion'];
  textFields.forEach(field => {
    if (venue[field] && typeof venue[field] === 'string') {
      let text = venue[field];
      const original = text;
      removePatterns.forEach(p => {
        text = text.replace(p, '');
      });
      // Clean up double spaces and orphaned punctuation
      text = text.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim();
      if (text !== original) {
        venue[field] = text;
        totalRemoved++;
      }
    }
  });

  // Clean FAQ answers
  if (venue.faq) {
    venue.faq.forEach(item => {
      let text = item.a;
      const original = text;
      removePatterns.forEach(p => {
        text = text.replace(p, '');
      });
      text = text.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim();
      if (text !== original) {
        item.a = text;
        totalRemoved++;
      }
    });
  }

  // Clean timeline
  if (venue.timeline && Array.isArray(venue.timeline)) {
    venue.timeline.forEach(item => {
      ['description', 'checkpoint'].forEach(field => {
        if (item[field]) {
          let text = item[field];
          const original = text;
          removePatterns.forEach(p => {
            text = text.replace(p, '');
          });
          text = text.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim();
          if (text !== original) {
            item[field] = text;
            totalRemoved++;
          }
        }
      });
    });
  }

  // Clean checklist
  if (venue.checklist && Array.isArray(venue.checklist)) {
    venue.checklist.forEach(item => {
      if (item.detail) {
        let text = item.detail;
        const original = text;
        removePatterns.forEach(p => {
          text = text.replace(p, '');
        });
        text = text.replace(/\s{2,}/g, ' ').replace(/,\s*,/g, ',').replace(/\.\s*\./g, '.').trim();
        if (text !== original) {
          item.detail = text;
          totalRemoved++;
        }
      }
    });
  }
});

fs.writeFileSync(filePath, JSON.stringify(venues, null, 2), 'utf8');

// Verify remaining
const newContent = fs.readFileSync(filePath, 'utf8');
const remaining = (newContent.match(/예산|가격|입장료/g) || []).length;
const remainMoney = (newContent.match(/만\s*원/g) || []).length;

console.log(`FAQ items removed: ${faqsRemoved}`);
console.log(`Text fields cleaned: ${totalRemoved}`);
console.log(`Remaining 예산/가격/입장료: ${remaining}`);
console.log(`Remaining 만 원/만원: ${remainMoney}`);
