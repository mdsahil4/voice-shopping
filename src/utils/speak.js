// src/utils/speak.js

export function speak(message, opts = {}) {
  if (!("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance();

  // Generate natural speech output depending on the action type
  if (opts.type === "modify") {
    if (opts.field === "price" && opts.item && opts.value) {
      utterance.text = `Okay, I updated ${opts.item}'s price to ${opts.value} rupees.`;
    } else if (opts.field === "qty" && opts.item && opts.value) {
      utterance.text = `Sure, I changed ${opts.item} quantity to ${opts.value}.`;
    } else if (opts.field === "brand" && opts.item && opts.value) {
      utterance.text = `Updated ${opts.item} brand to ${opts.value}.`;
    } else if (opts.field === "category" && opts.item && opts.value) {
      utterance.text = `Moved ${opts.item} into category ${opts.value}.`;
    } else {
      utterance.text = `Updated ${opts.item}.`;
    }
  } else if (opts.type === "add" && opts.item) {
    utterance.text = `Added ${opts.qty || 1} ${opts.item} to your list.`;
  } else if (opts.type === "remove" && opts.item) {
    utterance.text = `Removed ${opts.item} from your list.`;
  } else if (opts.type === "search") {
    utterance.text =
      opts.count && opts.count > 0
        ? `I found ${opts.count} item${opts.count > 1 ? "s" : ""}.`
        : "No matching items found.";
  } else if (opts.type === "refresh") {
    utterance.text = "Suggestions refreshed.";
  } else {
    // Default fallback if no structured options are provided
    utterance.text = message;
  }

  // Speech synthesis settings
  utterance.lang = "en-IN";   // Default to Indian English (can change to en-US, en-GB)
  utterance.rate = 1;         // Speaking speed (0.8–1.2 is a natural range)
  utterance.pitch = 1;        // Voice pitch
  utterance.volume = 1;       // Volume level (0–1)

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
