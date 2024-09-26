import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './dashboard/Dashboard';
import UserDashboard from './dashboard/UserDashboard';
import DashboardUserControl from './dashboard/DashboardUserControl';

function App() {
  const [token, setToken] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setToken={setToken} />} />
        <Route path="/dashboard" element={<Dashboard token={token} />} />
        <Route path="/userDashboard" element={<UserDashboard token={token} />} />
        <Route path="/dashboardUserControl" element={<DashboardUserControl token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;
