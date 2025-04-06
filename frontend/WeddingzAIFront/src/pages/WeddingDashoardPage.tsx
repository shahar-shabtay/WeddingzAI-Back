import React from "react";
import WeddingDashboard from "../components/WeddingDashboard/WeddingDash";
import { NavBar } from "../components/NavBar/NavBar";

const WeddingDashboardPage: React.FC = () => {
  return (
    <div>
        <NavBar />
      <WeddingDashboard />
    </div>
  );
};

export default WeddingDashboardPage;
