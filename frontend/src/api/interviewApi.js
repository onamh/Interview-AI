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

export const logoutUser = async () => {
  try {
    await api.post("/api/auth/logout");
  } catch {}
};

/* ==================================================
   User Profile Endpoints
================================================== */

export const getUserProfile = async () => {
  const response = await api.get("/api/users/profile");
  return response.data;
};

export const updateUserProfile = async (profileData) => {
  const response = await api.put("/api/users/profile", profileData);
  return response.data;
};

export const changeUserPassword = async (current_password, new_password) => {
  const response = await api.put("/api/users/password", {
    current_password,
    new_password,
  });
  return response.data;
};

/* ==================================================
   Interview Lifecycle Endpoints
================================================== */

export const startInterview = async (interviewData) => {
  const response = await api.post("/api/interviews/start", interviewData);
  return response.data;
};

export const nextQuestion = async (sessionId, answer) => {
  const response = await api.post("/api/interview/next", {
    session_id: sessionId,
    answer,
  });
  return response.data;
};

export const evaluateInterview = async (sessionId) => {
  const response = await api.post("/api/interview/evaluate", {
    session_id: sessionId,
  });
  return response.data;
};

/* ==================================================
   Voice & Audio Transcription Endpoints
================================================== */

export const transcribeAudio = async (audioBlob, fileName = "recording.webm") => {
  const formData = new FormData();
  formData.append("file", audioBlob, fileName);

  const response = await api.post("/api/voice/transcribe", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/* ==================================================
   Resume Processing & Library
================================================== */

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/api/resumes/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const listUserResumes = async () => {
  const response = await api.get("/api/resumes");
  return response.data;
};

export const getResumeDetail = async (id) => {
  const response = await api.get(`/api/resumes/${id}`);
  return response.data;
};

export const deleteResumeRecord = async (id) => {
  const response = await api.delete(`/api/resumes/${id}`);
  return response.data;
};

/* ==================================================
   Dashboard, History & Analytics
================================================== */

export const getInterviewHistory = async () => {
  const response = await api.get("/api/dashboard/recent-interviews");
  return response.data;
};

export const getCandidateStats = async () => {
  const response = await api.get("/api/dashboard/overview");
  return response.data;
};

export const getDashboardAnalytics = async () => {
  const response = await api.get("/api/dashboard/analytics");
  return response.data;
};

export const getFilteredHistory = async (params = {}) => {
  const response = await api.get("/api/history", { params });
  return response.data;
};

export const getInterviewDetail = async (id) => {
  const response = await api.get(`/api/interviews/${id}`);
  return response.data;
};

export const deleteInterviewRecord = async (id) => {
  const response = await api.delete(`/api/history/${id}`);
  return response.data;
};
