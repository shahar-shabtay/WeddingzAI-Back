import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

const BudgetPage = () => {
    const [totalBudget, setTotalBudget] = useState<number>(0);
    const [categories, setCategories] = useState<{ name: string; amount: number }[]>([]);
    const [categoryName, setCategoryName] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    
    const handleAddCategory = () => {
        if (categoryName && amount) {
            setCategories([...categories, { name: categoryName, amount: parseFloat(amount) || 0 }]);
            setCategoryName("");
            setAmount("");
        }
    };
      
    return (
        <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4">
            <h2 className="text-xl font-bold">Wedding Budget</h2>
            <div>
                <label className="block font-medium">Total Budget:</label>
                <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                    className="border p-2 w-full rounded"
                />
            </div>

            <div>
                <label className="block font-medium">Category Name:</label>
                <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="border p-2 w-full rounded"
                />
            </div>

            <div>
                <label className="block font-medium">Amount:</label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="border p-2 w-full rounded"
                />
            </div>

            <button
                onClick={handleAddCategory}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Add Category
            </button>

            {categories.length > 0 && (
                <div className="mt-4">
                    <h3 className="text-lg font-bold">Budget Breakdown</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categories}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="amount" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default BudgetPage;
