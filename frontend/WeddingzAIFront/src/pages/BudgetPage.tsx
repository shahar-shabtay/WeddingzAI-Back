import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const categoryOptions = [
  "Venue", "Suit", "Dress", "Catering", "Photography", "Flowers", "Music", "Transportation", "Decorations"
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AF19FF", "#FF4560", "#FF69B4", "#32CD32", "#FFD700", "#FFFFFF"];

const BudgetPage = () => {
  const [totalBudget, setTotalBudget] = useState("");
  const [categories, setCategories] = useState<{ name: string; amount: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const handleAddCategory = () => {
    const amount = parseFloat(newAmount);
    if (!selectedCategory || isNaN(amount) || amount <= 0) return;
    setCategories([...categories, { name: selectedCategory, amount }]);
    setSelectedCategory("");
    setNewAmount("");
  };

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const totalSpent = categories.reduce((acc, curr) => acc + curr.amount, 0);
  const remainingBudget = totalBudget ? Math.max(parseFloat(totalBudget) - totalSpent, 0) : 0;
  
  const pieData = [
    ...categories,
    { name: "Remaining Budget", amount: remainingBudget }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <div>
        <h2 className="text-xl font-bold">Wedding Budget</h2>
        <div className="mb-4">
          <label className="block">Total Wedding Budget:</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="Enter Total Budget"
            className="border p-2 w-full rounded"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold">Add Categories</h3>
        <div className="flex space-x-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border p-2 w-full rounded"
          >
            <option value="" disabled>Select a category</option>
            {categoryOptions.map((category, index) => (
              <option key={index} value={category}>{category}</option>
            ))}
          </select>
          <input
            type="number"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            placeholder="Amount"
            className="border p-2 w-full rounded"
          />
          <button
            onClick={handleAddCategory}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Add Category
          </button>
        </div>
      </div>

      <div className="mt-4">
        {categories.length > 0 && <h3 className="text-lg font-bold">Categories:</h3>}
        <div>
          {categories.map((category, index) => (
            <div key={index} className="flex justify-between items-center py-2">
              <span>{category.name}: ${category.amount.toFixed(2)}</span>
              <button onClick={() => handleRemoveCategory(index)} className="text-red-500">Remove</button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold">Remaining Budget</h3>
        <div>
          {totalBudget && categories.length > 0 ? (
            <p>Remaining Budget: ${remainingBudget.toFixed(2)}</p>
          ) : (
            <p>Enter a total budget and categories to see remaining budget.</p>
          )}
        </div>
      </div>

      {categories.length > 0 && totalBudget && (
        <div className="mt-6">
          <h3 className="text-lg font-bold">Budget Breakdown</h3>
          <PieChart width={400} height={400}>
            <Pie
              data={pieData}
              dataKey="amount"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              fill="#8884d8"
              label={(entry) => `${((entry.amount / parseFloat(totalBudget)) * 100).toFixed(2)}%`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.name === "Remaining Budget" ? "#FFFFFF" : COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      )}
    </div>
  );
};

export default BudgetPage;