import { AlertCircle, AlertTriangle, CalendarPlus, CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeader } from "../../components/SectionHeader";

export function ScheduleBoard({ classes, courses, schedule, onGenerate }) {
  const [classId, setClassId] = useState("");
  const [days, setDays] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!notice || notice.type !== "success") return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setNotice(null);
    try {
      await onGenerate({ class_id: classId || undefined, days });
      setNotice({ type: "success", message: "课程表生成成功" });
    } catch (error) {
      if (error.saveSucceeded) {
        setNotice({
          type: "warning",
          message: error.message || "生成成功，但数据刷新出了问题，请点击刷新数据按钮恢复",
        });
      } else {
        setNotice({
          type: "error",
          message: `生成失败：${error.message || "请稍后重试"}`,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="module">
      {notice && (
        <div className={`notice ${notice.type}`}>
          {notice.type === "success" && <CheckCircle2 size={18} />}
          {notice.type === "error" && <AlertCircle size={18} />}
          {notice.type === "warning" && <AlertTriangle size={18} />}
          <span className="notice-message">{notice.message}</span>
          {notice.type !== "success" && (
            <button
              type="button"
              className="notice-close"
              onClick={() => setNotice(null)}
              aria-label="关闭提示"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      <form className="toolbar-panel" onSubmit={submit}>
        <label>
          排课班级
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            disabled={submitting}
          >
            <option value="">全部班级</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          生成课次数
          <input
            min="1"
            max="30"
            type="number"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            disabled={submitting}
          />
        </label>
        <button
          className="primary-action"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="spin" />
              生成中...
            </>
          ) : (
            <>
              <CalendarPlus size={18} />
              自动生成课程表
            </>
          )}
        </button>
      </form>

      <div className="table-panel">
        <SectionHeader eyebrow="Schedule" title="课程表" />
        <div className="schedule-grid">
          {schedule.map((session) => (
            <article className="schedule-card" key={session.id}>
              <span>{session.date}</span>
              <h3>{session.course_title}</h3>
              <p>{session.class_name}</p>
              <div>
                <small>{session.time}</small>
                <small>{session.room}</small>
                <small>{session.teacher}</small>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="table-panel">
        <SectionHeader eyebrow="Courses" title="课程库" />
        <div className="course-tags">
          {courses.map((course) => (
            <span key={course.id}>
              {course.title} · {course.duration}课时 · {course.category}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
