import axios from "axios";

const API_URL = "http://127.0.0.1:5000/auth"; // Flask backend URL

export const login = async (username, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/login`,
      { username, password }, 
      { headers: { "Content-Type": "application/json" } }
    );

    localStorage.setItem("token", response.data.access_token);
    return true;
  } catch (error) {
    console.error("Login failed", error.response?.data || error.message);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  return !!token; 
};

// Add register function
export const register = async (username, email, password) => {
  try {
    const response = await axios.post(
      `${API_URL}/register`,
      { username, email, password }, 
      { headers: { "Content-Type": "application/json" } }
    );

    return response.data; // This might include a success message or further instructions
  } catch (error) {
    console.error("Registration failed", error.response?.data || error.message);
    return null;
  }
};
