import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { recordHistory } from "../utils/history"; // keeps track of user history

export default function ShoppingList({ uid }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");

  // Fetch live shopping list items when the user is authenticated
  useEffect(() => {
    if (!uid) return;
    const colRef = collection(db, "users", uid, "shoppingList");
    const q = query(colRef, orderBy("addedAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => unsub();
  }, [uid]);

  // Add a new item to the shopping list
  async function addItem(e) {
    e?.preventDefault();
    if (!uid) return;
    const trimmed = name.trim();
    if (!trimmed) return;

    const colRef = collection(db, "users", uid, "shoppingList");
    await addDoc(colRef, {
      name: trimmed,
      qty: Number(qty) || 1,
      brand: brand || null,
      category: category || "uncategorized",
      price: price ? Number(price) : null,
      addedAt: serverTimestamp(),
      bought: false,
    });

    // Update user history with the added item
    await recordHistory(uid, trimmed);

    // Reset form fields
    setName("");
    setQty(1);
    setBrand("");
    setCategory("");
    setPrice("");
  }

  // Toggle the bought status of an item
  async function toggleBought(id, bought) {
    if (!uid) return;
    const colRef = collection(db, "users", uid, "shoppingList");
    await updateDoc(doc(colRef, id), { bought: !bought });
  }

  // Remove an item from the shopping list
  async function removeItem(id) {
    if (!uid) return;
    const colRef = collection(db, "users", uid, "shoppingList");
    await deleteDoc(doc(colRef, id));
  }

  return (
    <div className="p-4 bg-white rounded-2xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-indigo-700 flex items-center gap-2">
        Shopping List
      </h2>

      {/* Form to quickly add a new item */}
      <form onSubmit={addItem} className="grid grid-cols-2 gap-2">
        <input
          className="border rounded px-2 py-2 col-span-2"
          placeholder="Item name (e.g., milk)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border rounded px-2 py-2"
          type="number"
          min="1"
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />
        <input
          className="border rounded px-2 py-2"
          placeholder="Brand (optional)"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        />
        <input
          className="border rounded px-2 py-2"
          placeholder="Category (e.g., dairy)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <input
          className="border rounded px-2 py-2"
          type="number"
          min="0"
          placeholder="Price (₹)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <button className="px-3 py-2 rounded bg-indigo-600 text-white col-span-2 hover:bg-indigo-700 transition">
          Add
        </button>
      </form>

      {/* List of items */}
      {items.length === 0 ? (
        <div className="text-gray-500 text-sm">No items yet</div>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex justify-between items-center border-b pb-2 hover:bg-gray-50 rounded px-2 transition"
            >
              <div>
                <div
                  className={`${
                    it.bought ? "line-through text-gray-400" : "text-gray-800"
                  }`}
                >
                  {it.qty ? `${it.qty} × ` : ""}
                  {it.name}
                  {it.brand ? ` · ${it.brand}` : ""}
                  {it.price ? ` · ₹${it.price}` : ""}
                </div>
                <div className="text-xs text-gray-500">
                  {it.category || "uncategorized"}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleBought(it.id, it.bought)}
                  className="px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200 transition"
                  title="Toggle bought"
                >
                  ✓
                </button>
                <button
                  onClick={() => removeItem(it.id)}
                  className="px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
                  title="Remove"
                >
                  🗑
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
