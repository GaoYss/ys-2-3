import { AlertCircle, CheckCircle2, Loader2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";

const statusLabels = {
  present: "出勤",
  late: "迟到",
  leave: "请假",
  absent: "缺勤",
};

export function AttendancePanel({ schedule, classes, attendance, studentMap, onRecord, onBatchRecord }) {
  const [sessionId, setSessionId] = useState(schedule[0]?.id || "");
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState("present");
  const [batchStatuses, setBatchStatuses] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  const selectedSession = schedule.find((item) => item.id === Number(sessionId));
  const students = useMemo(() => {
    if (!selectedSession) return [];
    return (
      classes.find((item) => item.id === selectedSession.class_id)?.students || []
    );
  }, [classes, selectedSession]);

  const filteredAttendance = useMemo(() => {
    if (!sessionId) return attendance;
    return attendance.filter((r) => r.session_id === Number(sessionId));
  }, [attendance, sessionId]);

  useEffect(() => {
    const initial = {};
    students.forEach((student) => {
      const existing = attendance.find(
        (r) => r.session_id === Number(sessionId) && r.student_id === student.id
      );
      initial[student.id] = existing?.status || "present";
    });
    setBatchStatuses(initial);
  }, [sessionId, students, attendance]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function submit(event) {
    event.preventDefault();
    if (!sessionId || !studentId || submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await onRecord({
        session_id: Number(sessionId),
        student_id: Number(studentId),
        status,
      });
      setNotice({ type: "success", message: "考勤保存成功" });
      setStudentId("");
    } catch (error) {
      setNotice({
        type: "error",
        message: `保存失败：${error.message || "请稍后重试"}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBatch(event) {
    event.preventDefault();
    if (!sessionId || students.length === 0 || batchSubmitting) return;
    setBatchSubmitting(true);
    setNotice(null);
    const records = students.map((student) => ({
      student_id: student.id,
      status: batchStatuses[student.id] || "present",
    }));
    try {
      await onBatchRecord({
        session_id: Number(sessionId),
        records,
      });
      setNotice({ type: "success", message: `全班 ${students.length} 人考勤已提交` });
    } catch (error) {
      setNotice({
        type: "error",
        message: `批量提交失败：${error.message || "请稍后重试"}`,
      });
    } finally {
      setBatchSubmitting(false);
    }
  }

  function setAllStatus(targetStatus) {
    if (batchSubmitting) return;
    const updated = {};
    students.forEach((student) => {
      updated[student.id] = targetStatus;
    });
    setBatchStatuses(updated);
  }

  function updateStudentStatus(studentId, newStatus) {
    if (batchSubmitting) return;
    setBatchStatuses((prev) => ({ ...prev, [studentId]: newStatus }));
  }

  function handleSessionChange(event) {
    if (submitting || batchSubmitting) return;
    setSessionId(event.target.value);
  }

  return (
    <section className="module">
      {notice && (
        <div className={`notice ${notice.type}`}>
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      <form className="toolbar-panel" onSubmit={submit}>
        <label>
          课次
          <select
            value={sessionId}
            onChange={handleSessionChange}
            disabled={submitting || batchSubmitting}
          >
            {schedule.map((item) => (
              <option key={item.id} value={item.id}>
                {item.date} · {item.class_name} · {item.course_title}
              </option>
            ))}
          </select>
        </label>
        <label>
          学员
          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            disabled={submitting || batchSubmitting}
          >
            <option value="">选择学员</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          状态
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            disabled={submitting || batchSubmitting}
          >
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary-action"
          type="submit"
          disabled={submitting || batchSubmitting || !studentId}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="spin" />
              保存中...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              保存考勤
            </>
          )}
        </button>
      </form>

      {selectedSession && (
        <div className="table-panel">
          <SectionHeader eyebrow="Batch" title="全班批量考勤" />
          <div className="batch-toolbar">
            <span className="batch-hint">
              <Users size={16} />
              共 {students.length} 名学员
            </span>
            <div className="batch-presets">
              {Object.entries(statusLabels).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`preset-btn ${value}`}
                  onClick={() => setAllStatus(value)}
                  disabled={batchSubmitting || submitting}
                >
                  全部{label}
                </button>
              ))}
            </div>
            <button
              className="primary-action batch-submit"
              type="button"
              onClick={submitBatch}
              disabled={batchSubmitting || submitting || students.length === 0}
            >
              {batchSubmitting ? (
                <>
                  <Loader2 size={18} className="spin" />
                  提交中...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  提交全班考勤
                </>
              )}
            </button>
          </div>
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>学员</th>
                  <th>手机号</th>
                  <th>考勤状态</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>{student.name}</strong>
                    </td>
                    <td>{student.phone}</td>
                    <td>
                      <select
                        className="status-select"
                        value={batchStatuses[student.id] || "present"}
                        onChange={(event) => updateStudentStatus(student.id, event.target.value)}
                        disabled={batchSubmitting || submitting}
                      >
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="table-panel">
        <SectionHeader
          eyebrow="Attendance"
          title={
            selectedSession
              ? `考勤记录 · ${selectedSession.date} ${selectedSession.class_name}`
              : "考勤记录"
          }
        />
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>课程</th>
                <th>学员</th>
                <th>班级</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", color: "#8a9ba0" }}>
                    当前课次暂无考勤记录
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => {
                  const session = schedule.find((item) => item.id === record.session_id);
                  const student = studentMap.get(record.student_id);
                  return (
                    <tr key={record.id}>
                      <td>{session?.course_title || "未知课程"}</td>
                      <td>{student?.name || "未知学员"}</td>
                      <td>{student?.className || session?.class_name || "-"}</td>
                      <td>
                        <span className={`status-pill ${record.status}`}>
                          {statusLabels[record.status] || record.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
