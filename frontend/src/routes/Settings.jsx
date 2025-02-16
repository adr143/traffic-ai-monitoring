import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SettingStream from "../components/SettingStream";
import { logout } from "../auth/auth";

const Settings = ({ socket, local_url }) => {
    const [lineCoords, setLineCoords] = useState({ x1: 0, y1: 0, x2: 0, y2: 0 });
    const [polygonCoords, setPolygonCoords] = useState({
        x1: 0, y1: 0, x2: 0, y2: 0, x3: 0, y3: 0, x4: 0, y4: 0
    });
    const [speedLimit, setSpeedLimit] = useState(0)

    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleLineChange = (e) => {
        const { name, value } = e.target;
        setLineCoords((prev) => ({
            ...prev,
            [name]: parseInt(value, 10) || 0,
        }));
    };

    const handlePolygonChange = (e) => {
        const { name, value } = e.target;
        setPolygonCoords((prev) => ({
            ...prev,
            [name]: parseInt(value, 10) || 0,
        }));
    };

    const handleLimitChange = (e) => {
        setSpeedLimit(parseInt(e.target.value, 10) || 0);
    };
    

    const sendData = async (endpoint, data, setState) => {
        try {
            const response = await fetch(`${local_url}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error(`Failed to send data to ${endpoint}`);
            setState(data);
            console.log(`Data sent to Flask (${endpoint}):`, data);
        } catch (error) {
            console.error(`Error sending data to ${endpoint}:`, error);
        }
    };

    const sendSpeedLimit = async (data) => {
        try {
            const response = await fetch(`${local_url}/update_speed_limit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!response.ok) throw new Error(`Failed to send data to ${endpoint}`);
            setSpeedLimit(data['speed_limit']);
            console.log(`Data sent to Flask (${endpoint}):`, data);
        } catch (error) {
            console.error(`Error sending data to ${endpoint}:`, error);
        }
    };

    useEffect(() => {
        const fetchData = async (endpoint, setState) => {
            try {
                const response = await fetch(`${local_url}/${endpoint}`);
                if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
                const data = await response.json();
                setState(data);
            } catch (error) {
                console.error(`Error fetching ${endpoint}:`, error);
            }
        };

        const fetchSpeedLimit = async () => {
            try {
                const response = await fetch(`${local_url}/get_speed_limit`);
                if (!response.ok) throw new Error("Failed to fetch speed limit");
                const data = await response.json();
                setSpeedLimit(data['speed_limit']);
            } catch (error) {
                console.error("Error fetching speed limit:", error);
            }
        }

        fetchSpeedLimit();
        fetchData("get_line", setLineCoords);
        fetchData("get_polygon", setPolygonCoords);
    }, [local_url]);


    return (
        <div className="grid grid-rows-[auto_1fr] gap-4 h-screen w-screen p-8">
            <nav className="flex justify-between items-center bg-white shadow-md py-4 px-6 rounded-lg">
                <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>Traffic Monitoring System</h1>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md" onClick={handleLogout}>
                    Logout
                </button>
            </nav>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">Camera Streams</h1>
                    <div className="border-2 border-gray-400 rounded-lg overflow-hidden shadow-md">
                        <SettingStream socket={socket} />
                    </div>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg overflow-y-auto max-h-[80vh]">
                    <h1 className="text-2xl font-bold mb-4 text-center">Settings</h1>
                    <div className="mb-4">
                        <label htmlFor="speed_limit" className="block">Speed Limit (km/h)</label>
                        <input type="number" name="speed_limit" value={speedLimit} onChange={handleLimitChange} className="border p-2 rounded w-full" />
                        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-2 w-full"
                            onClick={() => sendSpeedLimit({ speed_limit: speedLimit })}>
                            Apply Speed Limit
                        </button>
                    </div>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold mb-2">Set Checkpoint Coordinates</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 gap-4">
                            {Object.entries(lineCoords).slice(0, 2).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <label htmlFor={key}>{key.toUpperCase()}:</label>
                                    <input type="number" name={key} value={value} onChange={handleLineChange} className="border p-2 rounded" />
                                </div>
                            ))}
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                            {Object.entries(lineCoords).slice(2).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <label htmlFor={key}>{key.toUpperCase()}:</label>
                                    <input type="number" name={key} value={value} onChange={handleLineChange} className="border p-2 rounded" />
                                </div>
                            ))}
                            </div>
                        </div>
                        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-2 w-full"
                            onClick={() => sendData("update_line", lineCoords, setLineCoords)}>
                            Apply Line
                        </button>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Set Speed Region Coordinates</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 gap-4">
                            {Object.entries(polygonCoords).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <label htmlFor={key}>{key.toUpperCase()}:</label>
                                    <input type="number" name={key} value={value} onChange={handlePolygonChange} className="border p-2 rounded" />
                                </div>
                            ))} 
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                            {Object.entries(polygonCoords).slice(4).map(([key, value]) => (
                                <div key={key} className="flex flex-col">
                                    <label htmlFor={key}>{key.toUpperCase()}:</label>
                                    <input type="number" name={key} value={value} onChange={handlePolygonChange} className="border p-2 rounded" />
                                </div>
                            ))}
                            </div>
                        </div>
                        <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded mt-2 w-full"
                            onClick={() => sendData("update_polygon", polygonCoords, setPolygonCoords)}>
                            Apply Polygon
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
