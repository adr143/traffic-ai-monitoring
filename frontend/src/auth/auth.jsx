export const login = async (username, password, local_url) => {
  try {
    const response = await fetch(`${local_url}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error("Login failed");
    }

    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    return true;
  } catch (error) {
    console.error("Login failed", error.message);
    return false;
  }
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const register = async (username, email, password, local_url) => {
  try {
    const response = await fetch(`${local_url}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await response.json();
    console.log("Response:", data);

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error.message);
    return null;
  }
};

