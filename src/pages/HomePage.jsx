import { Navigate } from "react-router-dom";

const HomePage = () => {
  const hasToken = localStorage.getItem("access_token");
  if (!hasToken) return <Navigate to="/login" replace />;

  return <div>HomePage</div>;
};

export default HomePage;
