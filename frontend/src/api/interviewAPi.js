import api from "./api";

/* ===========================
   Start Interview
=========================== */

export const startInterview = async (interviewData) => {
  const response = await api.post(
    "/interview/start",
    interviewData
  );

  return response.data;
};

/* ===========================
   Next Question
=========================== */

export const nextQuestion = async (sessionId, answer) => {
  const response = await api.post(
    "/interview/next",
    {
      session_id: sessionId,
      answer,
    }
  );

  return response.data;
};

/* ===========================
   Final Evaluation
=========================== */

export const evaluateInterview = async (sessionId) => {
  const response = await api.post(
    "/interview/evaluate",
    {
      session_id: sessionId,
    }
  );

  return response.data;
};

/* ===========================
   Upload Resume
=========================== */

export const uploadResume = async (file) => {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post(
    "/resume/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};