import { useEffect, useState } from "react";
import VoiceInput from "./components/VoiceInput";
import ShoppingList from "./components/ShoppingList";
import Suggestions from "./components/Suggestions";
import { initAuth, auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  doc as docRef,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { recordHistory } from "./utils/history";
import { speak } from "./utils/speak";

function App() {
  const [uid, setUid] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    initAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) setUid(user.uid);
    });
  }, []);

  // Auto-hide alerts after a few seconds
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  async function handleCommand(parsed) {
    if (!parsed || !uid) return;

    const col = collection(db, "users", uid, "shoppingList");

    // Handle refresh command
    if (parsed.action === "refresh") {
      setRefreshKey((k) => k + 1);
      speak("Suggestions refreshed");
      setAlert({ type: "info", msg: "Suggestions refreshed" });
      return;
    }

    // Handle add command
    if (parsed.action === "add" && parsed.item) {
      await addDoc(col, {
        name: parsed.item,
        qty: parsed.qty || 1,
        brand: parsed.brand || null,
        category: parsed.category || "uncategorized",
        price: parsed.price?.value || null,
        addedAt: serverTimestamp(),
        bought: false,
      });
      await recordHistory(uid, parsed.item);
      speak(`Added ${parsed.qty || 1} ${parsed.item}`);
      setAlert({ type: "success", msg: `Added ${parsed.item}` });
    }

    // Handle remove command
    if (parsed.action === "remove" && parsed.item) {
      const snap = await getDocs(query(col));
      const targets = snap.docs.filter((d) =>
        (d.data().name || "").toLowerCase().includes(parsed.item.toLowerCase())
      );

      if (targets.length === 0) {
        speak(`${parsed.item} not in the list`);
        setAlert({ type: "error", msg: `${parsed.item} not in the list` });
        return;
      }

      for (const d of targets) {
        await deleteDoc(docRef(col, d.id));
      }
      speak(`Removed ${parsed.item}`);
      setAlert({ type: "success", msg: `Removed ${parsed.item}` });
    }

    // Handle modify command
    if (parsed.action === "modify" && parsed.item) {
      const snap = await getDocs(query(col));
      const targets = snap.docs.filter((d) =>
        (d.data().name || "").toLowerCase().includes(parsed.item.toLowerCase())
      );

      if (targets.length === 0) {
        speak(`${parsed.item} not in the list`);
        setAlert({ type: "error", msg: `${parsed.item} not in the list` });
        return;
      }

      let updated = false;
      for (const d of targets) {
        const updatePayload = {};

        // Determine which field to update
        const field = parsed.field || (parsed.price ? "price" : parsed.qty ? "qty" : null);

        if (field === "qty" && parsed.qty) updatePayload.qty = parsed.qty;
        if (field === "brand" && parsed.brand) updatePayload.brand = parsed.brand;
        if (field === "price" && parsed.price?.value) updatePayload.price = parsed.price.value;
        if (field === "category" && parsed.category) updatePayload.category = parsed.category;

        if (Object.keys(updatePayload).length > 0) {
          await updateDoc(docRef(col, d.id), updatePayload);
          updated = true;
        }
      }

      if (updated) {
        speak(`Updated ${parsed.item}`);
        setAlert({ type: "success", msg: `Updated ${parsed.item}` });
      } else {
        speak(`Could not update ${parsed.item}`);
        setAlert({ type: "warning", msg: `Could not update ${parsed.item}` });
      }
    }

    // Handle search command
    if (parsed.action === "search") {
      const snap = await getDocs(query(col));
      let matches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (parsed.item) {
        matches = matches.filter((it) =>
          (it.name || "").toLowerCase().includes(parsed.item.toLowerCase())
        );
      }
      if (parsed.brand) {
        matches = matches.filter((it) =>
          (it.brand || "").toLowerCase().includes(parsed.brand.toLowerCase())
        );
      }
      if (parsed.category) {
        matches = matches.filter((it) =>
          (it.category || "").toLowerCase().includes(parsed.category.toLowerCase())
        );
      }
      if (parsed.price) {
        if (parsed.price.op === "under") {
          matches = matches.filter(
            (it) => it.price != null && it.price <= parsed.price.value
          );
        } else if (parsed.price.op === "between") {
          matches = matches.filter(
            (it) =>
              it.price != null &&
              it.price >= parsed.price.min &&
              it.price <= parsed.price.max
          );
        }
      }

      setSearchResults(matches);

      if (matches.length === 0) {
        speak("No items found");
        setAlert({ type: "warning", msg: "No items found" });
      } else {
        speak(`Found ${matches.length} item${matches.length > 1 ? "s" : ""}`);
        setAlert({ type: "info", msg: `Found ${matches.length} items` });
      }
    }
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-300">
      {/* Header */}
      <header className="flex justify-center items-center bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 shadow-lg animate-fadeIn">
        <h1 className="text-3xl font-extrabold tracking-wide drop-shadow-lg">
          🛒 Voice Shopping Assistant
        </h1>
      </header>

      {/* Alerts */}
      {alert && (
        <div
          className={`mx-auto mt-3 px-4 py-2 rounded-lg text-sm font-medium shadow-md transition-all animate-fadeIn
            ${alert.type === "error" ? "bg-red-100 text-red-700" : ""}
            ${alert.type === "success" ? "bg-green-100 text-green-700" : ""}
            ${alert.type === "warning" ? "bg-yellow-100 text-yellow-700" : ""}
            ${alert.type === "info" ? "bg-blue-100 text-blue-700" : ""}`}
        >
          {alert.msg}
        </div>
      )}

      {uid ? (
        <>
          {/* Voice input section */}
          <div className="flex justify-center py-6 animate-fadeInUp">
            <div className="bg-white shadow-xl rounded-2xl p-6 w-[500px] transform hover:scale-105 transition-all duration-300">
              <VoiceInput onCommand={handleCommand} />
            </div>
          </div>

          {/* Main layout */}
          <div className="flex-1 grid grid-cols-3 gap-6 px-6 pb-6">
            {/* Shopping list */}
            <div className="col-span-2 bg-white shadow-xl rounded-2xl p-4 overflow-auto transform transition duration-300 hover:shadow-2xl">
              <ShoppingList uid={uid} />
            </div>

            {/* Suggestions and search results */}
            <div className="flex flex-col gap-6">
              <div className="bg-white shadow-xl rounded-2xl p-4 flex-1 overflow-auto transform transition duration-300 hover:shadow-2xl">
                <Suggestions uid={uid} key={refreshKey} />
              </div>
              {searchResults.length > 0 && (
                <div className="bg-white shadow-xl rounded-2xl p-4 flex-1 overflow-auto transform transition duration-300 hover:shadow-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold text-indigo-700">
                      🔎 Search Results
                    </h2>
                    <button
                      onClick={() => setSearchResults([])}
                      className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600 transition"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {searchResults.map((it) => (
                      <li
                        key={it.id}
                        className="border-b pb-1 hover:bg-gray-100 rounded transition"
                      >
                        {it.qty} × {it.name}
                        {it.brand ? ` · ${it.brand}` : ""}
                        {it.category ? ` · ${it.category}` : ""}
                        {it.price ? ` · ₹${it.price}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-500 text-center flex-1 flex items-center justify-center">
          Signing in…
        </div>
      )}
    </div>
  );
}

export default App;
