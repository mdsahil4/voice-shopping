import React, { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { getSeasonalNow, getSubstitutes } from "../utils/suggestions";

// Normalize item names for comparison
const norm = (s) => (s || "").trim().toLowerCase();

export default function Suggestions({ uid }) {
  const [listItems, setListItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load shopping list and history from Firestore
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const listCol = collection(db, "users", uid, "shoppingList");
        const histCol = collection(db, "users", uid, "history");

        const [listSnap, histSnap] = await Promise.all([
          getDocs(listCol),
          getDocs(query(histCol, orderBy("count", "desc"))),
        ]);

        setListItems(listSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setHistory(histSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading suggestions:", err);
      } finally {
        setLoading(false);
      }
    }
    if (uid) load();
  }, [uid]);

  const existing = useMemo(
    () => new Set(listItems.map((i) => norm(i.name))),
    [listItems]
  );

  // Suggestions based on history
  const topHistory = history
    .map((h) => h.name || h.id)
    .filter((n) => n && !existing.has(norm(n)))
    .slice(0, 6);

  // Seasonal suggestions
  const seasonal = getSeasonalNow()
    .filter((n) => !existing.has(norm(n)))
    .slice(0, 4);

  // Suggested substitutes
  const subs = useMemo(() => {
    const s = new Set();
    listItems.forEach((i) =>
      getSubstitutes(i.name).forEach((x) => s.add(x))
    );
    return [...s].filter((n) => !existing.has(norm(n))).slice(0, 6);
  }, [listItems, existing]);

  // Quickly add a suggestion to the shopping list
  async function quickAdd(name) {
    try {
      const col = collection(db, "users", uid, "shoppingList");
      await addDoc(col, {
        name,
        qty: 1,
        category: "uncategorized",
        brand: null,
        addedAt: serverTimestamp(),
        bought: false,
      });
    } catch (err) {
      console.error("Error adding suggestion:", err);
    }
  }

  if (loading) {
    return <div className="p-3 border rounded-2xl">Loading suggestions…</div>;
  }

  return (
    <div className="p-3 border rounded-2xl space-y-3">
      <h3 className="font-semibold text-lg">Suggestions</h3>

      {/* Suggestions based on user history */}
      {topHistory.length > 0 && (
        <Section title="Based on your history">
          {topHistory.map((n) => (
            <SuggestButton
              key={`h-${n}`}
              label={n}
              tag="History"
              onClick={() => quickAdd(n)}
            />
          ))}
        </Section>
      )}

      {/* Seasonal suggestions */}
      {seasonal.length > 0 && (
        <Section title="Seasonal picks">
          {seasonal.map((n) => (
            <SuggestButton
              key={`s-${n}`}
              label={n}
              tag="Seasonal"
              onClick={() => quickAdd(n)}
            />
          ))}
        </Section>
      )}

      {/* Substitute suggestions */}
      {subs.length > 0 && (
        <Section title="Consider substitutes">
          {subs.map((n) => (
            <SuggestButton
              key={`sub-${n}`}
              label={n}
              tag="Substitute"
              onClick={() => quickAdd(n)}
            />
          ))}
        </Section>
      )}

      {/* Fallback when no suggestions are available */}
      {topHistory.length === 0 && seasonal.length === 0 && subs.length === 0 && (
        <div className="text-sm text-gray-500">
          No suggestions yet — add some items first.
        </div>
      )}
    </div>
  );
}

// Helper components
function Section({ title, children }) {
  return (
    <div>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function SuggestButton({ label, onClick, tag }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1 rounded-full border hover:bg-gray-100 transition"
    >
      + {label}
      {tag && (
        <span className="text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700">
          {tag}
        </span>
      )}
    </button>
  );
}
