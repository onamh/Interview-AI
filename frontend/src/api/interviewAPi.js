import api from "./api";

export const startInterview = async (interviewData) => {
    const response = await api.post(
        "/interview/start",
        interviewData
    );

    return response.data;
};