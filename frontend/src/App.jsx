import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./routes/Dashboard";
import VehicleDetail from "./routes/VehicleDetail";
import LoginPage from "./routes/LoginPage";
import Settings from "./routes/Settings";
import VehicleRecords from "./routes/VehicleRecords";
import VehicleAnalytics from "./routes/VehicleAnalytics";
import { io } from "socket.io-client";
import { isAuthenticated } from "./auth/auth";
import "./App.css"

const socket = io("http://localhost:5000");  // Adjust this URL to your backend
const local_url = "http://localhost:5000";   // API Base URL

const PrivateRoute = ({ children }) => {
    return isAuthenticated() ? children : <Navigate to="/login" />;
    // return true;
  };

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<PrivateRoute><Dashboard socket={socket} local_url={local_url} /></PrivateRoute>} />
                <Route path="/settings" element={<PrivateRoute><Settings socket={socket} local_url={local_url} /></PrivateRoute>} />
                <Route path="/vehicle/:id" element={<PrivateRoute><VehicleDetail local_url={local_url} /></PrivateRoute>} />
                <Route path="/vehicle" element={<PrivateRoute><VehicleRecords local_url={local_url} /></PrivateRoute>} />
                <Route path="/analytics" element={<PrivateRoute><VehicleAnalytics local_url={local_url} /></PrivateRoute>} />
            </Routes>
        </Router>
    );
}

export default App;
