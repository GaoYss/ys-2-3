const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  } catch (_) {
    throw new Error("网络连接失败，请确认后端服务已启动");
  }

  if (!response.ok) {
    throw new Error("请求出错，请稍后重试或刷新页面");
  }

  return response.json();
}

export const api = {
  getClasses: () => request("/classes"),
  createClass: (payload) =>
    request("/classes", { method: "POST", body: JSON.stringify(payload) }),
  addStudent: (classId, payload) =>
    request(`/classes/${classId}/students`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCourses: () => request("/courses"),
  getSchedule: () => request("/schedule"),
  generateSchedule: (payload) =>
    request("/schedule/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAttendance: () => request("/attendance"),
  recordAttendance: (payload) =>
    request("/attendance", { method: "POST", body: JSON.stringify(payload) }),
  batchRecordAttendance: (payload) =>
    request("/attendance/batch", { method: "POST", body: JSON.stringify(payload) }),
  getHourStats: () => request("/stats/hours"),
};
