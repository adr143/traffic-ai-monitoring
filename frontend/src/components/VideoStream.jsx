// VideoStream.jsx
import React, { useEffect, useState } from 'react';

const VideoStream = ({ socket }) => {
    const [frame, setFrame] = useState("");

    useEffect(() => {

        const handleFrame = (data) => {
            setFrame(data);
        };

        socket.on('frame', handleFrame);

        return () => {
            socket.off('frame', handleFrame);
        };
    }, []);  // Effect now correctly depends on `cameraName`

    return (
        <div className="w-full max-w-2xl mx-auto border-4 border-gray-500 rounded-lg overflow-hidden shadow-lg aspect-video flex items-center justify-center bg-gray-900">
        {frame ? (
            <img
            src={`data:image/jpeg;base64,${frame}`}
            alt="Camera Feed"
            className="w-full h-full object-cover rounded-[3%]"
            />
        ) : (
            <p className="text-white text-lg">Loading...</p>
        )}
        </div>
    );
};

export default VideoStream;