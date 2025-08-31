// src/utils/commandParser.js

// Map of number words (1–20 + tens)
const numberWords = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100
};

function wordsToNumber(str) {
  if (!str) return null;
  const parts = str.toLowerCase().split(/\s+/);
  let total = 0;
  let current = 0;

  for (const w of parts) {
    if (numberWords[w]) {
      if (w === "hundred" && current > 0) {
        current *= 100;
      } else {
        current += numberWords[w];
      }
    }
  }
  total += current;
  return total || null;
}

// Action synonyms
const ACTIONS = {
  add: ["add", "buy", "want", "need", "include", "put", "place", "insert"],
  remove: ["remove", "delete", "take off", "drop", "discard", "don’t buy"],
  search: ["find", "search", "show me", "look for", "get", "list"],
  modify: ["update", "change", "modify", "edit", "set", "replace"],
  refresh: ["refresh", "reload", "update suggestions"]
};

// Simple category keywords
const CATEGORY_KEYWORDS = {
  dairy: ["milk", "butter", "cheese", "curd", "yogurt"],
  grains: ["rice", "wheat", "flour", "bread", "atta"],
  snacks: ["chips", "biscuits", "chocolate", "namkeen", "cookies"],
  beverages: ["coke", "pepsi", "juice", "soda", "tea", "coffee"],
  cleaning: ["soap", "detergent", "phenyl", "cleaner", "shampoo"],
  produce: ["apple", "banana", "mango", "onion", "tomato", "potato"]
};

function detectAction(text) {
  for (const [action, words] of Object.entries(ACTIONS)) {
    if (words.some(w => text.includes(w))) return action;
  }
  return null;
}

function detectCategory(item) {
  if (!item) return null;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => item.includes(w))) return cat;
  }
  return null;
}

/**
 * parseCommand
 * Input: raw speech text
 * Output: { action, item, qty, brand, price, category, field, raw }
 */
export function parseCommand(text) {
  if (!text) return null;
  let t = text.toLowerCase();

  // Remove filler/noise words
  t = t.replace(/\b(please|could you|for me|into my list|to my list)\b/g, "").trim();

  // Detect action
  const action = detectAction(t);

  // Special case: refresh action
  if (action === "refresh") {
    return { raw: text, action: "refresh" };
  }

  // Quantity detection
  let qty = null;
  const numMatch = t.match(/\b(\d+)\b/);
  if (numMatch) {
    qty = parseInt(numMatch[1], 10);
  } else {
    const wordNumMatch = t.match(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)(?:\s+\w+)?\b/g
    );
    if (wordNumMatch) {
      qty = wordsToNumber(wordNumMatch.join(" "));
    }
  }

  // Price detection
  let price = null;
  const underMatch = t.match(/\bunder\s*(?:\$|₹)?\s*(\d+)\b/);
  if (underMatch) price = { op: "under", value: Number(underMatch[1]) };
  const betweenMatch = t.match(/\bbetween\s*(?:\$|₹)?\s*(\d+)\s+(?:and|-)\s*(?:\$|₹)?\s*(\d+)\b/);
  if (betweenMatch) price = { op: "between", min: Number(betweenMatch[1]), max: Number(betweenMatch[2]) };

  // Brand detection
  let brand = null;
  const brandMatch = t.match(/\bbrand\s+([a-z0-9\- ]+)\b/);
  if (brandMatch) {
    brand = brandMatch[1].trim();
  } else {
    const knownBrands = ["amul", "nestle", "britannia", "pepsi", "coca cola", "dabur", "parle"];
    brand = knownBrands.find(b => t.includes(b)) || null;
  }

  // Detect field for modify/add actions
  let field = null;
  if (action === "modify" || action === "add") {
    if (/\bqty|quantity\b/.test(t)) field = "qty";
    if (/\bprice|cost|rate\b/.test(t)) field = "price";
    if (/\bbrand\b/.test(t)) field = "brand";
    if (/\bcategory|section|type\b/.test(t)) field = "category";
    // If only "to <number>" is given, assume quantity
    if (!field && /\bto\s+\d+\b/.test(t)) field = "qty";
  }

  // Item extraction
  const verbs = [].concat(...Object.values(ACTIONS)).join("|");
  const regex = new RegExp(`\\b(?:${verbs})\\s+(.*)`);
  let item = t.match(regex)?.[1] || null;

  if (item) {
    item = item
      .replace(/\bunder\s*\d+\b/g, "")
      .replace(/\bbetween\s*\d+\s+(?:and|-)\s*\d+\b/g, "")
      .replace(/\bbrand\s+[a-z0-9\- ]+\b/g, "")
      .replace(/\b(price|cost|rate)\s*\d+\b/g, "")
      .replace(/\b(price|cost|rate)\b/g, "")      // remove standalone "price"
      .replace(/\b(category|section|type)\b/g, "")// remove standalone "category"
      .replace(/\b(quantity|qty)\b/g, "")         // remove standalone "qty"
      .replace(/\bto\s*\d+\b/g, "")               // remove "to 3"
      .trim();
  }

  // Category detection
  const category = detectCategory(item) || null;

  return { raw: text, action, item, qty, brand, price, category, field };
}
