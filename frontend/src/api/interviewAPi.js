import api from "./api";

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