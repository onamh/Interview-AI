import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <h1>AI Interview Coach</h1>

      <p>
        Welcome! Practice interviews with AI and improve your skills.
      </p>

      <button onClick={() => navigate("/setup")}>
        Start Interview
      </button>
    </div>
  );
}

export default Home;