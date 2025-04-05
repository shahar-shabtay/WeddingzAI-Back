import React, { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import "../styles/budget.css";
import { FaTrashAlt, FaChevronDown } from "react-icons/fa";


const categoryOptions = [
  "Venue", "Suit", "Dress", "Catering", "Photography", "Flowers", "Music", "Transportation", "Decorations"
];

const COLORS = ["#FFCCEA", "#d4af37", "#888888", "#9FB3DF", "#E6B2BA", "#FDB7EA", "#A7B49E", "#FDDBBB", "#CB9DF0", "#FFFFFF"];

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
    <div className="budget-container">
      <div>
        <h2 className="budget-title">Wedding Budget</h2>
        <p className="budget-subtitle">Plan your expenses with ease</p>
        <div className="mb-4">
          <label className="block font-medium">Total Wedding Budget:</label>
          <input
            type="number"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            placeholder="Enter Total Budget"
            className="budget-input"
          />
        </div>
      </div>
  
      <div className="add-category-card">
        <h3 className="budget-subtitle">Add Categories</h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="budget-input"
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
          className="budget-input"
        />
        <button
          onClick={handleAddCategory}
          className="add-btn"
        >
          Add
        </button>
      </div>
  
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="budget-subtitle">Categories</h3>
          {categories.map((category, index) => (
            <div key={index} className="category-card">
              <div className="category-header">
                <div className="category-title">
                  <FaChevronDown />
                  <span>{category.name}</span>
                </div>
                <div className="category-cost">
                  <span className="actual-cost">Actual Cost</span>
                  <span className="cost-amount">${category.amount.toFixed(2)}</span>
                  <button
                    onClick={() => handleRemoveCategory(index)}
                    className="delete-icon"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
  
      <div className="category-card">
        <h3 className="budget-subtitle">Remaining Budget</h3>
        <div className="cost-amount">
          {totalBudget && categories.length > 0 ? (
            <p>Remaining Budget: ${remainingBudget.toFixed(2)}</p>
          ) : (
            <p className="text-gray-500">Enter a total budget and categories to see remaining budget.</p>
          )}
        </div>
      </div>
  
      {categories.length > 0 && totalBudget && (
        <div className="chart-section">
          <h3 className="budget-subtitle">Budget Breakdown</h3>
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
                <Cell
                  key={`cell-${index}`}
                  fill={entry.name === "Remaining Budget" ? "#FFFFFF" : COLORS[index % COLORS.length]}
                />
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