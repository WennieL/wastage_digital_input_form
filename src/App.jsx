import React, { useState, useEffect } from "react";

// The standard item list (Standard Item List)
const ITEM_LIST = [
  "BALTIC",
  "CIABATTA LOAF",
  "CIABATTA ROLLS",
  "CHOC CROISSANT",
  "CLOUD 9",
  "CROISSANT",
  "DOUBLE LIGHT RYE TIN",
  "DOUBLE MULTIGRAIN TIN",
  "DOUBLE WHITE HIGH TOP",
  "FIG, FENNEL & WALNUT",
  "FOCACCIA",
  "LIGHT RYE TIN",
  "MULTIGRAIN CASA",
  "OLIVE CASA",
  "PAYSAN",
  "PIES - REGULAR",
  "PIES - PREMIUM",
  "FRUIT MINCE TART PACK",
  "FRUIT MINCE TART SINGLE",
  "POPPY CASA",
  "PREMIUM",
  "REGULAR",
  "RYE CASA",
  "SAUSAGE ROLLS",
  "SCHWARZBROT",
  "SESAME CASA",
  "SESAME TIN",
  "SPECIALTY LOAF",
  "SPELT",
  "SPICED FRUIT",
  "SPICED FRUIT CASA",
  "TURKISH LOAF",
  "TURKISH ROLLS",
  "VEGAN/VEGETARIAN",
  "WHITE CASA",
  "WHITE CASA STICK",
  "WHITE HIGN TOP",
  "WHOLEMEAL CASA",
];

// Status Message Component (Replaces browser alerts)
const StatusMessage = ({ type, message }) => {
  const colors = {
    error: "bg-red-100 text-red-700",
    success: "bg-green-100 text-green-700",
    loading: "bg-indigo-100 text-indigo-700",
    info: "bg-gray-100 text-gray-700",
  };
  const icons = { error: "❌", success: "✅", loading: "⏳", info: "ℹ️" };

  // Do not render if there is no message
  if (!message) return null;

  return (
    <div
      className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${colors[type]}`}
    >
      <span className="mr-2">{icons[type]}</span>
      {message}
    </div>
  );
};

// Utility function for initial quantity setup (Initializes all standard item quantities to 0)
const getInitialQuantities = () =>
  ITEM_LIST.reduce((acc, item) => {
    acc[item] = 0;
    return acc;
  }, {});

// =========================================================
// Main Application Component
// =========================================================
const App = () => {
  // *** Replace this with your n8n Webhook URL ***
  const WEBHOOK_URL =
    "https://event-tracker-nt.zeabur.app/webhook/wastage/submit_digital";
  const LOCAL_STORAGE_KEY = "wastageFormDraft"; // Local storage key name

  const stores = ["NT", "KT", "BC", "BB", "GP"];
  const employees = [
    "Kylie",
    "Isabel",
    "Lizzie",
    "Bridey",
    "Zara",
    "Lia",
    "Anais",
    "Nicholas",
    "Lance",
    "Dianne",
    "Katrina",
    "Fletcher",
    "Monique",
    "Kris",
    "Olive",
    "Hannah",
    "Soraya",
    "Emmanuelle",
    "Rika",
    "Yuriko",
    "Tara",
    "Jake",
    "Felicia",
    "Nate",
  ];

  // --- State Initialization and Local Storage Loading ---

  // Load draft from localStorage
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (draft) {
        return JSON.parse(draft);
      }
    } catch (error) {
      console.error("Error loading draft from localStorage:", error);
    }
    return {};
  };

  const draft = loadDraft();

  // Main form state
  const [store, setStore] = useState(draft.store || "");
  const [employee, setEmployee] = useState(draft.employee || "");
  const [comment, setComment] = useState(draft.comment || "");
  const [status, setStatus] = useState({
    type: "info",
    message: "Select Store and Employee, then enter quantity (0-20).",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Standard item wastage quantity state
  const initialQuantities = getInitialQuantities();
  const mergedQuantities = {
    ...initialQuantities,
    ...(draft.quantities || {}),
  };
  const [quantities, setQuantities] = useState(mergedQuantities);

  // Custom item state
  const [customItems, setCustomItems] = useState(draft.customItems || []);
  const [newCustomItemName, setNewCustomItemName] = useState("");
  const [newCustomItemRemaining, setNewCustomItemRemaining] = useState(1);

  // Custom item editing state
  const [editingItemName, setEditingItemName] = useState(null);
  const [editingItemNewName, setEditingItemNewName] = useState("");
  const [editingItemNewRemaining, setEditingItemNewRemaining] = useState(1);

  // Reset confirmation state
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  // --- useEffect for Local Storage Saving ---
  useEffect(() => {
    // Save important state variables to local storage
    const draftToSave = {
      store,
      employee,
      comment,
      quantities,
      customItems,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(draftToSave));
    } catch (error) {
      console.error("Error saving draft to localStorage:", error);
    }
  }, [store, employee, comment, quantities, customItems]);

  // Generate quantity dropdown options (0-20)
  const qtyOptions = [...Array(21).keys()].map((num) => (
    <option key={num} value={num}>
      {num}
    </option>
  ));

  // Handle standard item quantity change
  const handleQuantityChange = (itemName, value) => {
    const num = parseInt(value, 10);
    setQuantities((prev) => ({
      ...prev,
      [itemName]: isNaN(num) ? 0 : num,
    }));
    if (status.type !== "info") {
      setStatus({
        type: "info",
        message: "Select Store and Employee, then enter quantity (0-20).",
      });
    }
  };

  // Handle standard item quick reset
  const handleQuickReset = (itemName) => {
    setQuantities((prev) => ({
      ...prev,
      [itemName]: 0,
    }));
    setStatus({
      type: "info",
      message: `Item "${itemName}" quantity reset to 0.`,
    });
  };

  // Handle adding a new custom item
  const handleAddCustomItem = () => {
    const name = newCustomItemName.trim().toUpperCase();
    const remaining = newCustomItemRemaining;

    if (!name || remaining <= 0) {
      return setStatus({
        type: "error",
        message: "❌ Custom item name is required and quantity must be > 0.",
      });
    }

    // Prevent duplication
    if (
      ITEM_LIST.includes(name) ||
      customItems.some((item) => item.name === name)
    ) {
      return setStatus({
        type: "error",
        message: `❌ Item "${name}" is already in the list or is a duplicate custom item.`,
      });
    }

    setCustomItems((prev) => [...prev, { name: name, remaining: remaining }]);
    setNewCustomItemName("");
    setNewCustomItemRemaining(1);
    setStatus({
      type: "info",
      message: "Custom item added to the list. Please remember to submit!",
    });
  };

  // Handle removing a custom item
  const handleRemoveCustomItem = (name) => {
    setCustomItems((prev) => prev.filter((item) => item.name !== name));
    setStatus({ type: "info", message: `Item "${name}" has been removed.` });
  };

  // Start editing a custom item
  const handleStartEdit = (item) => {
    if (editingItemName || isLoading || isConfirmingReset) return;

    setEditingItemName(item.name);
    setEditingItemNewName(item.name);
    setEditingItemNewRemaining(item.remaining);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItemName(null);
    setEditingItemNewName("");
    setEditingItemNewRemaining(1);
    setStatus({ type: "info", message: "Edit cancelled." });
  };

  // Update a custom item
  const handleUpdateCustomItem = () => {
    const oldName = editingItemName;
    const newName = editingItemNewName.trim().toUpperCase();
    const newRemaining = editingItemNewRemaining;

    if (!newName || newRemaining <= 0) {
      return setStatus({
        type: "error",
        message: "❌ New item name is required and quantity must be > 0.",
      });
    }

    // Check for duplication
    if (
      newName !== oldName &&
      (ITEM_LIST.includes(newName) ||
        customItems.some((item) => item.name === newName))
    ) {
      return setStatus({
        type: "error",
        message: `❌ Item "${newName}" is already in the list or is a duplicate custom item.`,
      });
    }

    setCustomItems((prev) =>
      prev.map((item) =>
        item.name === oldName
          ? { name: newName, remaining: newRemaining }
          : item
      )
    );

    handleCancelEdit();
    setStatus({
      type: "success",
      message: "✅ Custom item updated successfully!",
    });
  };

  // --- Full Reset Functions (One-click Reset) ---
  const handleStartReset = () => {
    if (isLoading || editingItemName) {
      return setStatus({
        type: "error",
        message: "❌ Please complete submission or editing first.",
      });
    }
    setIsConfirmingReset(true);
  };

  const handleCancelReset = () => {
    setIsConfirmingReset(false);
    setStatus({ type: "info", message: "Reset cancelled." });
  };

  const handleConfirmReset = () => {
    // Reset all states
    setStore("");
    setEmployee("");
    setComment("");
    setQuantities(getInitialQuantities());
    setCustomItems([]);

    // Clear local storage draft
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    setIsConfirmingReset(false);
    setStatus({ type: "info", message: "✅ All data cleared, form reset." });
  };
  // --- End Full Reset Functions ---

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!store || !employee) {
      return setStatus({
        type: "error",
        message: "❌ Please select a store and an employee.",
      });
    }

    if (editingItemName) {
      return setStatus({
        type: "error",
        message:
          "❌ Please save or cancel the current item edit before submitting.",
      });
    }

    // 1. Get standard items with quantity > 0
    const predefinedItems = [];
    for (const name in quantities) {
      const remaining = quantities[name];
      if (remaining > 0) {
        predefinedItems.push({ name: name, remaining: remaining });
      }
    }

    // 2. Merge standard and custom items
    const cleaned_items = [...predefinedItems, ...customItems];

    if (cleaned_items.length === 0) {
      return setStatus({
        type: "error",
        message: "❌ No wastage items recorded (all quantities are 0).",
      });
    }

    const payload = {
      store,
      employee,
      comment: comment || "N/A",
      cleaned_items, // Unified list of wastage items
    };

    setIsLoading(true);
    setStatus({ type: "loading", message: "🚀 Submitting data..." });

    try {
      // Simulate Webhook POST request
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStatus({
          type: "success",
          message: "✅ Wastage data submitted successfully!",
        });

        // Clear draft and form state on success
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setStore("");
        setEmployee("");
        setComment("");
        setQuantities(getInitialQuantities());
        setCustomItems([]);

        setTimeout(
          () =>
            setStatus({
              type: "info",
              message: "Select Store and Employee, then enter quantity (0-20).",
            }),
          5000
        );
      } else {
        const errorText = await res.text();
        setStatus({
          type: "error",
          message: `Submission failed (${res.status}): ${errorText.substring(0, 100)}...`,
        });
      }
    } catch (err) {
      setStatus({ type: "error", message: `⚠️ Network Error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gray-50 font-sans">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-xl p-6 border border-gray-100 relative">
        <h1 className="text-center text-2xl font-bold text-gray-800 mb-4">
          🍞 Bakery Wastage Data Input Form
        </h1>

        {/* Status Message Display Area */}
        <div className="mb-4">
          <StatusMessage type={status.type} message={status.message} />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Store and Employee Selection */}
          <div className="flex gap-4">
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl flex-1 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
              required
              disabled={isLoading || editingItemName || isConfirmingReset}
            >
              <option value="">Select Store</option>
              {stores.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="p-3 border border-gray-300 rounded-xl flex-1 text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
              required
              disabled={isLoading || editingItemName || isConfirmingReset}
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Comments (e.g., today's condition, optional)"
            className="p-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition"
            rows="2"
            disabled={isLoading || editingItemName || isConfirmingReset}
          />

          <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 p-2 rounded-lg bg-gray-100">
            Standard Wastage Items & Quantity
          </h2>

          {/* Standard Item List */}
          <div className="bg-white rounded-xl shadow-inner border border-gray-200 max-h-96 overflow-y-auto">
            {ITEM_LIST.map((item) => (
              <div
                key={item}
                className="flex justify-between items-center p-3 border-b last:border-b-0 hover:bg-indigo-50 transition duration-150"
              >
                <span className="text-sm font-semibold text-gray-800 flex-1 min-w-0 break-words pr-4">
                  {item}
                </span>
                <div className="flex items-center gap-1">
                  <select
                    value={quantities[item]}
                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                    className="p-1 border border-gray-300 rounded-lg w-16 text-sm text-center bg-white shadow-sm"
                    disabled={isLoading || editingItemName || isConfirmingReset}
                  >
                    {qtyOptions}
                  </select>
                  {/* Quick Reset Button */}
                  {quantities[item] > 0 && (
                    <button
                      type="button"
                      onClick={() => handleQuickReset(item)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 transition leading-none w-6 h-6 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200"
                      disabled={
                        isLoading || editingItemName || isConfirmingReset
                      }
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Item Section */}
          <h2 className="text-lg font-bold text-gray-800 mt-4 mb-2 p-2 rounded-lg bg-indigo-100">
            Add Custom/Special Item
          </h2>

          {/* Custom Item Input */}
          <div className="flex gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-200">
            <input
              type="text"
              placeholder="Item Name (e.g., NEW PIZZA BASE)"
              value={newCustomItemName}
              onChange={(e) => setNewCustomItemName(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg flex-1 text-sm shadow-sm"
              disabled={isLoading || editingItemName || isConfirmingReset}
            />
            <select
              value={newCustomItemRemaining}
              onChange={(e) =>
                setNewCustomItemRemaining(parseInt(e.target.value, 10))
              }
              className="p-1 border border-gray-300 rounded-lg w-16 text-sm text-center bg-white shadow-sm"
              disabled={isLoading || editingItemName || isConfirmingReset}
            >
              {qtyOptions.slice(1)}
            </select>
            <button
              type="button"
              onClick={handleAddCustomItem}
              disabled={
                isLoading ||
                editingItemName ||
                isConfirmingReset ||
                !newCustomItemName.trim()
              }
              className={`p-2 rounded-lg font-semibold text-sm transition ${
                isLoading ||
                editingItemName ||
                isConfirmingReset ||
                !newCustomItemName.trim()
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
              }`}
            >
              + Add
            </button>
          </div>

          {/* Custom Item List (Add/Edit/Remove) */}
          {customItems.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-300 mt-2">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">
                Custom Item List:
              </h3>
              {customItems.map((item) => (
                <div
                  key={item.name}
                  className="flex flex-col border-b border-yellow-200 last:border-b-0 py-2"
                >
                  {editingItemName === item.name ? (
                    // Edit Mode
                    <div className="flex flex-col gap-2 p-2 bg-yellow-100 rounded-lg">
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={editingItemNewName}
                          onChange={(e) =>
                            setEditingItemNewName(e.target.value)
                          }
                          className="p-1 border border-gray-300 rounded-lg flex-1 text-sm shadow-sm font-semibold"
                          placeholder="Item Name"
                        />
                        <select
                          value={editingItemNewRemaining}
                          onChange={(e) =>
                            setEditingItemNewRemaining(
                              parseInt(e.target.value, 10)
                            )
                          }
                          className="p-1 border border-gray-300 rounded-lg w-16 text-sm text-center bg-white shadow-sm"
                        >
                          {qtyOptions.slice(1)}
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleUpdateCustomItem}
                          className="text-white bg-green-600 hover:bg-green-700 text-xs font-semibold px-2 py-1 rounded transition"
                          disabled={
                            isLoading ||
                            !editingItemNewName.trim() ||
                            editingItemNewRemaining <= 0 ||
                            isConfirmingReset
                          }
                        >
                          [Save]
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="text-gray-700 bg-gray-300 hover:bg-gray-400 text-xs font-semibold px-2 py-1 rounded transition"
                          disabled={isConfirmingReset}
                        >
                          [Cancel]
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-yellow-900 flex-1 min-w-0 break-words pr-2">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-yellow-900">
                          Qty: {item.remaining}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold p-1 transition"
                          disabled={
                            isLoading || editingItemName || isConfirmingReset
                          }
                        >
                          [Edit]
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomItem(item.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold p-1 transition"
                          disabled={
                            isLoading || editingItemName || isConfirmingReset
                          }
                        >
                          [Remove]
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit and Reset Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={handleStartReset}
              disabled={isLoading || editingItemName}
              className={`flex-1 py-3 text-sm font-bold rounded-xl transition duration-300 transform hover:scale-[1.01] ${
                isLoading || editingItemName
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-300/50"
              }`}
            >
              Clear All Data
            </button>
            <button
              type="submit"
              disabled={
                isLoading ||
                !store ||
                !employee ||
                editingItemName ||
                isConfirmingReset
              } // Disable while editing or confirming reset
              className={`flex-1 py-3 font-extrabold rounded-xl shadow-lg transition duration-300 transform hover:scale-[1.01] ${
                isLoading ||
                !store ||
                !employee ||
                editingItemName ||
                isConfirmingReset
                  ? "bg-gray-400 cursor-not-allowed shadow-inner"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-400/50"
              }`}
            >
              {isLoading ? "⏳ Submitting..." : "✅ Submit Wastage Data"}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Reset (Secondary Confirmation Popup) */}
      {isConfirmingReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100">
            <h3 className="text-xl font-bold text-red-600 mb-3">
              ⚠️ Are you sure you want to Reset?
            </h3>
            <p className="text-gray-700 mb-6">
              This will clear **all entered data** (including store, employee,
              quantities, and comments) and cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelReset}
                className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
