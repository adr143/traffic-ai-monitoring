import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const VehicleList = ({local_url}) => {
    const [vehicles, setVehicles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${local_url}/vehicles`)
            .then(response => response.json())
            .then(data => setVehicles(data))
            .catch(error => console.error("Error fetching data:", error));
    }, []);

    const handleSelect = (vehicle) => {
        navigate(`/vehicle/${vehicle.id}`, { state: vehicle });
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-4">Vehicle List</h1>
            {/* Scrollable List Container */}
            <ul className="space-y-4 max-h-96 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                {vehicles.map(vehicle => (
                    <li key={vehicle.id} 
                        className="p-4 bg-white shadow-md rounded-lg flex items-center gap-4 cursor-pointer hover:bg-gray-200"
                        onClick={() => handleSelect(vehicle)}
                    >
                        <img src={vehicle.image_path || "default-image.jpg"} 
                             alt={vehicle.name} 
                             className="w-16 h-16 rounded-md object-cover" 
                        />
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
    );
};

export default VehicleList;
