import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

const VehicleRecords = ({ local_url }) => {
    const [records, setRecords] = useState([]);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [violationFilter, setViolationFilter] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                const response = await fetch(`${local_url}/vehicles`);
                if (!response.ok) throw new Error("Failed to fetch vehicle records");
                const data = await response.json();
                setRecords(data);
            } catch (error) {
                console.error("Error fetching records:", error);
            }
        };

        fetchRecords();
        const interval = setInterval(fetchRecords, 5000);
        return () => clearInterval(interval);
    }, [local_url]);

    // Filter records based on date range and violation type
    const filteredRecords = records.filter((record) => {
        const recordTime = new Date(record.timestamp);
        const matchesDate =
            (!startDate || recordTime >= new Date(startDate)) &&
            (!endDate || recordTime <= new Date(endDate));
        const matchesViolation =
            !violationFilter || record.violations.includes(violationFilter);
        return matchesDate && matchesViolation;
    });

    // Export data as Excel
    const exportToExcel = () => {
        const exportData = filteredRecords.map((r) => ({
            ID: r.id,
            Timestamp: r.timestamp,
            Violations: r.violations.length > 0 ? r.violations.join(", ") : "None",
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Vehicle Records");

        XLSX.writeFile(workbook, "Vehicle_Records.xlsx");
    };

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-100">
            {/* Navigation Bar */}
            <nav className="bg-white shadow-md p-4 flex justify-center sticky top-0 z-50">
                <h1 className="text-2xl font-bold cursor-pointer" onClick={() => navigate("/")}>Traffic Monitoring System</h1>
            </nav>

            {/* Main Content */}
            <div className="flex flex-col flex-grow p-6 max-w-7xl mx-auto bg-white shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold mb-4">Vehicle Records</h1>

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
                        {[...new Set(records.flatMap((r) => r.violations))]
                            .map((v) => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                    </select>
                    <button
                        onClick={exportToExcel}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md"
                    >
                        Export to Excel
                    </button>
                </div>

                {/* Scrollable Table */}
                <div className="overflow-auto max-h-[500px] border rounded-lg shadow-md bg-white">
                    <table className="min-w-full border-collapse">
                        <thead className="bg-gray-800 text-white sticky top-0">
                            <tr>
                                <th className="border border-gray-300 px-4 py-2">ID</th>
                                <th className="border border-gray-300 px-4 py-2">Timestamp</th>
                                <th className="border border-gray-300 px-4 py-2">Violations</th>
                                <th className="border border-gray-300 px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record) => (
                                <tr
                                    key={record.id}
                                    className="hover:bg-gray-100 cursor-pointer"
                                    onClick={() => navigate(`/vehicle/${record.id}`, { state: record })}
                                >
                                    <td className="border border-gray-300 px-4 py-2">{record.id}</td>
                                    <td className="border border-gray-300 px-4 py-2">{record.timestamp}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        {record.violations.length > 0
                                            ? record.violations.join(", ")
                                            : "None"}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                        <button className="bg-green-500 text-white px-3 py-1 rounded-md">
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VehicleRecords;
