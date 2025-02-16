import { useState } from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = ({local_url}) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!email.includes("@")) {
      alert("Please enter a valid email");
      return;
    }

    try {
      console.log(`${local_url}/subscribe`)
      const response = await fetch(`${local_url}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.status === 201) {
        alert("Subscription successful! Redirecting to login...");
        setSubscribed(true);
        setTimeout(() => navigate("/login"), 2000); // Redirect after success
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  const handleSkip = () => {
    navigate("/login");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome!</h1>
        <p className="text-gray-600 mb-6">Subscribe to receive daily reports.</p>

        {!subscribed ? (
          <>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
            />
            <button
              onClick={handleSubscribe}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
            >
              Subscribe & Proceed
            </button>
            <button
              onClick={handleSkip}
              className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg mt-2 hover:bg-gray-400 transition"
            >
              Skip & Proceed
            </button>
          </>
        ) : (
          <p className="text-green-600">Subscription successful! Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default LandingPage;
