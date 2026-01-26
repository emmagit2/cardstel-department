// App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./Layout"; // adjust path if needed

// Example pages
import TelcomDashboard from "./Pages/TelcomDashboard";
import EmbeddingDashboard from "./Pages/EmbeddingDashboard";
import StoreDashboard from "./Pages/StoreDashboard";
import AccountantDashboard from "./Pages/AccountantDashboard";
import StaffManagement from "./Pages/StaffManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home is using layout's special case */}
    
        <Route
          path="/telcom"
          element={
            <Layout currentPageName="TelcomDashboard">
              <TelcomDashboard />
            </Layout>
          }
        />

        <Route
          path="/embedding"
          element={
            <Layout currentPageName="EmbeddingDashboard">
              <EmbeddingDashboard />
            </Layout>
          }
        />

        <Route
          path="/store"
          element={
            <Layout currentPageName="StoreDashboard">
              <StoreDashboard />
            </Layout>
          }
        />

        <Route
          path="/accountant"
          element={
            <Layout currentPageName="AccountantDashboard">
              <AccountantDashboard />
            </Layout>
          }
        />

        <Route
          path="/staff"
          element={
            <Layout currentPageName="StaffManagement">
              <StaffManagement />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
