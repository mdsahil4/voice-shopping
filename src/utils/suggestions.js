// src/utils/suggestions.js

// Substitute item mappings
const substituteMap = {
  milk: ["almond milk", "soy milk"],
  sugar: ["jaggery", "brown sugar"],
  butter: ["ghee", "olive oil spread"],
  bread: ["multigrain bread", "gluten-free bread"],
};

export function getSubstitutes(item) {
  if (!item) return [];
  return substituteMap[item.toLowerCase()] || [];
}

// Seasonal items by month (0 = January ... 11 = December)
const seasonalByMonth = {
  0: ["oranges", "carrots"],          // January
  1: ["strawberries", "peas"],        // February
  2: ["mango", "watermelon"],         // March
  3: ["mango", "watermelon"],         // April
  4: ["mango", "litchi"],             // May
  5: ["cherries", "plums"],           // June
  6: ["corn", "cucumbers"],           // July
  7: ["apples", "grapes"],            // August
  8: ["apples", "pomegranates"],      // September
  9: ["pumpkin", "guava"],            // October
  10: ["oranges", "jaggery"],         // November
  11: ["cauliflower", "radish"],      // December
};

export function getSeasonalNow(date = new Date()) {
  const m = date.getMonth();
  return seasonalByMonth[m] || [];
}
