import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const VehicleDetail = ({local_url}) => {
    const [ licenseText, setLicenseText ] = useState("XXXX-XXXX")
    const { state: vehicle } = useLocation();

    const navigate = useNavigate();

    if (!vehicle) {
        return <p className="text-center text-lg text-red-600">Vehicle not found!</p>;
    }

    const fetchLicenseText = async (v_id) => {
        try {
            const response = await fetch(`${local_url}/get_license_text/${v_id}`);
            if (!response.ok) throw new Error("Failed to fetch speed limit");
            const data = await response.json();
            setLicenseText(data['license_text']);
        } catch (error) {
            console.error("Error fetching license text:", error);
        }
    }

    return (
        <div className="grid grid-rows-[1fr_9fr] h-screen items-center">
            <h1 className="text-2xl font-bold cursor-pointer text-center" onClick={() => navigate("/")} >Traffic Monitoring System</h1>
            <div className="grid grid-cols-2 gap-4 max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-lg">
                {/* Vehicle ID */}
                <div className="p-4">
                    <h1 className="text-3xl font-bold">Vehicle #{vehicle.id}</h1>
                    {/* Vehicle Image */}
                    <div className="flex flex-col">
                        <img 
                            src={vehicle.image_base64 ? `data:image/jpeg;base64,${vehicle.image_base64}` : "/default-image.png"} 
                            alt={`Vehicle ${vehicle.id}`} 
                            className="w-full h-64 object-cover rounded-lg mt-4"
                        />
                        <img 
                            src={vehicle.license_base64 ? `data:image/jpeg;base64,${vehicle.license_base64}` : "/default-image.png"} 
                            alt={`Vehicle ${vehicle.id} License`} 
                            className="w-full mt-4"
                            onClick={() => fetchLicenseText(vehicle.id)}
                        />
                    </div>
                </div>
                <div className="p-4">
                    <h2 className="text-xl font-semibold mt-4">Timestamp</h2>
                    <p className="text-sm text-gray-600">{vehicle.timestamp}</p>
                    <h2 className="text-xl font-semibold mt-4">Speed(km/h)</h2>
                    <p className="text-sm text-gray-600">{vehicle.speed}</p>
                    {/* Violations List */}
                    <div className="h-5/6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-xl font-semibold mt-4">Violations:</h2>
                            <ul className="list-disc pl-6 text-gray-700">
                                {vehicle.violations?.length > 0 
                                    ? vehicle.violations.map((v, i) => <li key={i}>{v}</li>) 
                                    : <li>No Violations</li>
                                }
                            </ul>
                        </div>
                        <div>
                            <h2 className="text-xl text-center font-semibold">License Plate</h2>
                            <p className="text-center">{licenseText}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleDetail;
