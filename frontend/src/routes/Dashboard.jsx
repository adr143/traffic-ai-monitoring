import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VideoStream from "../components/VideoStream";
import { logout } from "../auth/auth";

const Dashboard = ({ socket, local_url }) => {
    const [vehicles, setVehicles] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await fetch(`${local_url}/vehicles`);
                if (!response.ok) throw new Error("Failed to fetch vehicles");
                const data = await response.json();
                setVehicles(data);
            } catch (error) {
                console.error("Error fetching vehicles:", error);
            }
        };

        // Fetch every 1 second
        const interval = setInterval(fetchVehicles, 1000);
        return () => clearInterval(interval);
    }, [local_url]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (vehicle) => {
        navigate(`/vehicle/${vehicle.id}`, { state: vehicle });
    };

    return (
        <div className="grid grid-rows-[auto_1fr] gap-4 h-screen w-screen p-4 md:p-8">
            <nav className="px-4 flex justify-between items-center bg-white shadow-md py-4 rounded-lg">
                <h1 className="text-xl md:text-2xl font-bold cursor-pointer" onClick={() => navigate("/dashboard")}>Traffic Monitoring System</h1>
                <div className="relative" ref={dropdownRef}>
                    <button
                        className="bg-gray-700 text-white px-4 py-2 rounded-md focus:outline-none"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        Menu ▼
                    </button>
                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10">
                            <button
                                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                onClick={() => navigate("/vehicle")}
                            >
                                Records
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                onClick={() => navigate("/analytics")}
                            >
                                Analytics
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                onClick={() => navigate("/settings")}
                            >
                                Settings
                            </button>
                            <button
                                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200"
                                onClick={handleLogout}
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </nav>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Left Side: Camera Feeds */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg overflow-auto w-full">
                    <h1 className="text-2xl font-bold mb-4">Camera Streams</h1>
                    <div className="w-full border-gray-400 rounded-lg overflow-hidden shadow-md">
                        <VideoStream socket={socket} />
                    </div>
                </div>
                {/* Right Side: Vehicle Records */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg overflow-hidden w-full">
                    <h1 className="text-2xl font-bold mb-4">Vehicle List</h1>
                    <ul className="space-y-4 max-h-96 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                        {vehicles.map((vehicle) => (
                            <li key={vehicle.id}
                                className="p-4 bg-white shadow-md rounded-lg flex items-center gap-4 cursor-pointer hover:bg-gray-200 transition"
                                onClick={() => handleSelect(vehicle)}
                            >
                                <div>
                                    <h2 className="text-lg font-semibold">{vehicle.name}</h2>
                                    <p className="text-sm text-gray-600">
                                        Violations: {vehicle.violations.length > 0 ? vehicle.violations.join(", ") : "None"}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
