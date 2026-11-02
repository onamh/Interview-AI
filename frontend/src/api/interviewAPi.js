import api from "./api";

/* ==================================================
   Authentication Endpoints
================================================== */

export const registerUser = async (name, email, password) => {
  const response = await api.post("/api/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
};

export const loginUser = async (email, password) => {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const demoLoginUser = async () => {
  const response = await api.post("/api/auth/demo-login");
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get("/api/auth/me");
  return response.data;
};

/* ==================================================
   Interview Lifecycle Endpoints
================================================== */

export const startInterview = async (interviewData) => {
  const response = await api.post("/interview/start", interviewData);
  return response.data;
};

export const nextQuestion = async (sessionId, answer) => {
  const response = await api.post("/interview/next", {
    session_id: sessionId,
    answer,
  });
  return response.data;
};

export const evaluateInterview = async (sessionId) => {
  const response = await api.post("/interview/evaluate", {
    session_id: sessionId,
  });
  return response.data;
};

/* ==================================================
   Resume Upload
================================================== */

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/resume/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/* ==================================================
   Dashboard & History Endpoints
================================================== */

export const getInterviewHistory = async () => {
  const response = await api.get("/api/interviews/history");
  return response.data;
};

export const getCandidateStats = async () => {
  const response = await api.get("/api/interviews/stats");
  return response.data;
};

export const getInterviewDetail = async (id) => {
  const response = await api.get(`/api/interviews/${id}`);
  return response.data;
};

export const deleteInterviewRecord = async (id) => {
  const response = await api.delete(`/api/interviews/${id}`);
  return response.data;
};
