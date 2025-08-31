// src/utils/history.js
import { doc, getDoc, setDoc, serverTimestamp, increment } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Record an item in the user's history so it can be used for future suggestions.
 * Creates or updates the document: users/{uid}/history/{item}.
 */
export async function recordHistory(uid, itemName) {
  if (!uid || !itemName) return;

  // Use the item name in lowercase as the document ID
  const id = itemName.trim().toLowerCase();
  const ref = doc(db, "users", uid, "history", id);

  const snap = await getDoc(ref);
  if (snap.exists()) {
    // Item already exists in history — increase count and update timestamp
    await setDoc(
      ref,
      { 
        count: increment(1), 
        lastSeen: serverTimestamp() 
      },
      { merge: true }
    );
  } else {
    // First time this item is added to history
    await setDoc(ref, { 
      name: itemName, 
      count: 1, 
      lastSeen: serverTimestamp() 
    });
  }
}
