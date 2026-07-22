import { useLocation } from "react-router-dom";

function Interview() {
  const { state } = useLocation();

  return (
    <div style={{ padding: "40px" }}>
      <h1>AI Interview</h1>

      <h2>Question 1</h2>

      <div
        style={{
          marginTop: "20px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: "10px",
        }}
      >
        {state.firstQuestion}
      </div>
    </div>
  );
}

export default Interview;