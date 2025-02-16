import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";

const VehicleAnalytics = ({ local_url }) => {
    const [records, setRecords] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [violationFilter, setViolationFilter] = useState("");
    const [viewType, setViewType] = useState("date");

    const navigate = useNavigate()

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch(`${local_url}/vehicles`);
                if (!response.ok) throw new Error("Failed to fetch vehicle data");
                const data = await response.json();
                setRecords(data);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchRecords();
        const interval = setInterval(fetchRecords, 5000);
        return () => clearInterval(interval);
    }, [local_url]);

    // Filter violations based on date range, type, and timestamp
    const filteredViolations = records.flatMap(record => 
        record.violations.map(v => ({
            timestamp: new Date(record.timestamp),
            type: v
        })).filter(({ timestamp }) => {
            return (!startDate || timestamp >= new Date(startDate)) &&
                   (!endDate || timestamp <= new Date(endDate)) &&
                   (!violationFilter || v === violationFilter);
        })
    );

    // Aggregate data by violation type
    const violationCounts = filteredViolations.reduce((acc, { type }) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});

    const chartData = Object.entries(violationCounts).map(([name, count]) => ({
        violation: name,
        count
    }));

    // Aggregate data by date or hour
    const timeGroupedData = filteredViolations.reduce((acc, { timestamp }) => {
        const key = viewType === "date" ? timestamp.toLocaleDateString() : `${timestamp.getHours()}:00`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const formattedTimeData = Object.entries(timeGroupedData).map(([key, count]) => ({
        label: key,
        count
    }));

    return (
        <div className="grid grid-rows-[auto_1fr] gap-4 h-screen w-screen p-8">
            <nav className="flex justify-center items-center bg-white shadow-md py-4 px-6 rounded-lg">
                <h1 className="text-2xl text-center font-bold cursor-pointer" onClick={() => navigate("/dashboard")}>Traffic Monitoring System</h1>
            </nav>
            <div className="p-6 max-w-6xl mx-auto bg-white shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Vehicle Violation Analytics</h1>

                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <input
                        type="date"
                        className="border border-gray-300 px-4 py-2 rounded-md"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <input
                        type="date"
                        className="border border-gray-300 px-4 py-2 rounded-md"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                    <select
                        className="border border-gray-300 px-4 py-2 rounded-md"
                        value={violationFilter}
                        onChange={(e) => setViolationFilter(e.target.value)}
                    >
                        <option value="">All Violations</option>
                        {[...new Set(records.flatMap(r => r.violations.map(v => v)))]
                            .map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <select
                        className="border border-gray-300 px-4 py-2 rounded-md"
                        value={viewType}
                        onChange={(e) => setViewType(e.target.value)}
                    >
                        <option value="date">By Date</option>
                        <option value="time">By Hour</option>
                    </select>
                </div>

                {/* Bar Chart for Violations */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
                    <h2 className="text-xl font-bold mb-2">Violation Frequency</h2>
                    <BarChart width={600} height={300} data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="violation" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#3182CE" />
                    </BarChart>
                </div>

                {/* Line Chart for Trends by Date or Hour */}
                <div className="bg-gray-100 p-6 rounded-lg shadow-lg mt-6">
                    <h2 className="text-xl font-bold mb-2">Violation Trends</h2>
                    <LineChart width={600} height={300} data={formattedTimeData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#82ca9d" />
                    </LineChart>
                </div>
            </div>
        </div>
    );
};

export default VehicleAnalytics;
