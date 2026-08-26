import { useEffect, useMemo, useState } from "react";
import { apiFetch, readApiErrorMessage } from "../api";

const TASK_FILTER_KEY = "todoApp_taskFilter";
const PRIORITIES = ["low", "normal", "high"];

function normalizeTaskPriority(value) {
  return PRIORITIES.includes(value) ? value : "normal";
}

function getInitialTaskFilter() {
  try {
    const stored = localStorage.getItem(TASK_FILTER_KEY);
    return ["all", "active", "starred"].includes(stored) ? stored : "all";
  } catch {
    return "all";
  }
}

function EmptyState({ filter }) {
  const title =
    filter === "active" ? "No active tasks" : filter === "starred" ? "No starred tasks" : "Nothing here yet";
  const line =
    filter === "active"
      ? "Everything is done, or switch to All / Starred."
      : filter === "starred"
        ? "Star important items with the star button, or choose another filter."
        : "Add a task above, star what matters, then check it off.";

  return (
    <div className="empty-state" role="status">
      <p className="empty-state-title">{title}</p>
      <p className="empty-state-line">{line}</p>
    </div>
  );
}

function TaskRow({ task, onCompleted, onStarred, onPriority, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title || "");
  const priority = normalizeTaskPriority(task.priority);

  useEffect(() => {
    setTitle(task.title || "");
  }, [task.title]);

  async function commitRename() {
    const next = title.trim();
    if (!next || next === task.title) {
      setTitle(task.title || "");
      setEditing(false);
      return;
    }
    const ok = await onRename(task.taskId, next);
    if (ok) setEditing(false);
  }

  return (
    <li className="task-row todo-item">
      <input
        type="checkbox"
        checked={Boolean(task.completed)}
        aria-label={`Mark ${task.title} complete`}
        onChange={event => onCompleted(task.taskId, event.target.checked)}
      />
      <button
        type="button"
        className={task.starred ? "btn-star starred" : "btn-star"}
        aria-label={task.starred ? "Remove star" : "Star task"}
        onClick={() => onStarred(task.taskId, !task.starred)}
      >
        {task.starred ? "★" : "☆"}
      </button>
      {editing ? (
        <input
          className="task-title-edit"
          value={title}
          autoFocus
          onChange={event => setTitle(event.target.value)}
          onBlur={commitRename}
          onKeyDown={event => {
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") {
              setTitle(task.title || "");
              setEditing(false);
            }
          }}
        />
      ) : (
        <span
          className={task.completed ? "task-title done" : "task-title"}
          title="Double-click to rename"
          onDoubleClick={() => setEditing(true)}
        >
          {task.title}
        </span>
      )}
      <select
        className={`priority-select task-priority priority-${priority}`}
        value={priority}
        aria-label={`Priority for ${task.title}`}
        onChange={event => onPriority(task.taskId, event.target.value)}
      >
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
      <button
        type="button"
        className="btn-delete"
        aria-label={`Delete ${task.title}`}
        onClick={() => onDelete(task.taskId, task.title)}
      >
        Delete
      </button>
    </li>
  );
}

function TasksPanel({ auth, setAuth, onAuthExpired }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState(getInitialTaskFilter);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [addError, setAddError] = useState("");

  async function request(path, options) {
    return apiFetch(path, options, auth, setAuth, onAuthExpired);
  }

  async function loadTasks() {
    setLoading(true);
    setListError("");
    try {
      const res = await request("/tasks");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setListError((data && (data.message || data.error)) || "Could not load tasks.");
        setTasks([]);
        return;
      }
      if (!Array.isArray(data)) {
        setListError("Unexpected response from tasks API.");
        setTasks([]);
        return;
      }
      setTasks(data);
    } catch (err) {
      setListError(err.message === "Authentication required" ? "" : "Network error. Check API URL and CORS.");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeFilter(next) {
    setFilter(next);
    try {
      localStorage.setItem(TASK_FILTER_KEY, next);
    } catch {
      /* ignore */
    }
  }

  const visibleTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => Number(Boolean(b.starred)) - Number(Boolean(a.starred)));
    if (filter === "active") return sorted.filter(task => !task.completed);
    if (filter === "starred") return sorted.filter(task => task.starred);
    return sorted;
  }, [filter, tasks]);

  async function addTask(event) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setAddError("Enter a task first.");
      return;
    }
    setAddError("");
    try {
      const res = await request("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, priority: normalizeTaskPriority(priority) })
      });
      if (!res.ok) {
        setAddError(await readApiErrorMessage(res, "Could not add task."));
        return;
      }
      setTitle("");
      setPriority("normal");
      await loadTasks();
    } catch {
      setAddError("Network error. Check API URL and CORS.");
    }
  }

  async function updateTask(taskId, payload, fallback) {
    setListError("");
    try {
      const res = await request(`/tasks/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        setListError(await readApiErrorMessage(res, fallback));
        return false;
      }
      await loadTasks();
      return true;
    } catch {
      setListError("Network error. Check API URL and CORS.");
      return false;
    }
  }

  async function deleteTask(taskId, taskTitle) {
    const label = (taskTitle || "").trim() || "this task";
    if (!window.confirm(`Delete "${label}"?`)) return;
    setListError("");
    try {
      const res = await request(`/tasks/${encodeURIComponent(taskId)}`, { method: "DELETE" });
      if (!res.ok) {
        setListError(await readApiErrorMessage(res, "Could not delete task."));
        return;
      }
      await loadTasks();
    } catch {
      setListError("Network error. Check API URL and CORS.");
    }
  }

  return (
    <section className="card card-tasks" aria-label="To-do list">
      <h2 className="card-title">To-do</h2>
      <form className="todo-input-row composer" onSubmit={addTask}>
        <input
          className="todo-input"
          type="text"
          placeholder="Add a task..."
          autoComplete="off"
          aria-label="New task"
          value={title}
          onChange={event => setTitle(event.target.value)}
        />
        <select
          className="priority-select composer-priority"
          aria-label="Task priority"
          value={priority}
          onChange={event => setPriority(event.target.value)}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </select>
        <button type="submit" className="add-button" aria-label="Add task">
          +
        </button>
      </form>
      {addError ? (
        <p className="composer-error" role="alert">
          {addError}
        </p>
      ) : null}

      <div className="task-filter-bar" role="toolbar" aria-label="Filter tasks">
        <div className="task-filter-chips">
          {["all", "active", "starred"].map(mode => (
            <button
              key={mode}
              type="button"
              className={filter === mode ? "chip is-active" : "chip"}
              onClick={() => changeFilter(mode)}
            >
              {mode === "all" ? "All" : mode === "active" ? "Active" : "Starred"}
            </button>
          ))}
        </div>
      </div>

      <div className="task-list-wrap">
        {listError ? (
          <p className="task-list-error" role="alert">
            {listError}
          </p>
        ) : null}
        {loading ? <p className="task-list-loading">Loading tasks...</p> : null}
        {!loading && !visibleTasks.length ? <EmptyState filter={filter} /> : null}
        <ul className="todo-list">
          {visibleTasks.map(task => (
            <TaskRow
              key={task.taskId}
              task={task}
              onCompleted={(taskId, completed) =>
                updateTask(taskId, { completed }, "Could not update task.")
              }
              onStarred={(taskId, starred) =>
                updateTask(taskId, { starred }, "Could not update task.")
              }
              onPriority={(taskId, nextPriority) =>
                updateTask(
                  taskId,
                  { priority: normalizeTaskPriority(nextPriority) },
                  "Could not update task priority."
                )
              }
              onRename={(taskId, nextTitle) =>
                updateTask(taskId, { title: nextTitle }, "Could not rename task.")
              }
              onDelete={deleteTask}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

export default TasksPanel;
