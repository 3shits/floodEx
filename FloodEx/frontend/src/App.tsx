import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dasboard";

interface User {
  name: string;
  location: string;
  lat: number;
  lng: number;
}

function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  return (
    <div>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LandingPage onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
