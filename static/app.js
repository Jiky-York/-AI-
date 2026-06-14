/* =====================================================================
   项目管理与经营分析AI助手  |  纯前端逻辑（零依赖）
   后端API: /api/projects   /api/ai/chat   /api/report/generate
   ===================================================================== */

(function () {
  "use strict";

  // ---------- 状态 ----------
  const state = {
    projects: [],
    reviews: [],
    selectedProjects: new Set(),
    reportText: "",
    pendingRows: [],
  };

  // ---------- 工具函数 ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const el = (tag, attrs = {}, ...children) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "style") node.setAttribute("style", v);
      else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null) node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c === null || c === undefined) continue;
      if (Array.isArray(c)) c.forEach(ch => node.appendChild(typeof ch === "string" ? document.createTextNode(ch) : ch));
      else node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return node;
  };

  async function getJSON(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error("请求失败: " + url);
    return res.json();
  }
  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });
    if (!res.ok) throw new Error("请求失败: " + url);
    return res.json();
  }

  function riskLabelColor(level) {
    if (level === "高") return "tag-high";
    if (level === "中") return "tag-mid";
    return "tag-low";
  }
  function meterClass(v, threshold = 90) {
    if (v > threshold + 10) return "d";
    if (v > threshold - 5) return "w";
    return "s";
  }

  // ---------- 路由 / 页面切换 ----------
  function switchPage(name) {
    $$(".page").forEach(p => p.classList.toggle("hidden", p.dataset.page !== name));
    $$(".menu-item").forEach(m => m.classList.toggle("active", m.dataset.page === name));
    // 首次进入页面时加载内容
    if (name === "risk") renderRiskPage();
    if (name === "review") renderReviewPage();
    if (name === "report") renderReportPage();
    if (name === "chat") renderChatPage();
  }

  // ---------- 总览：统计卡 & 高风险 ----------
  function renderDashboard() {
    const projects = state.projects;
    const total = projects.length;
    const highRisk = projects.filter(p => p.riskCount >= 2).length;
    const pendingReview = state.reviews.filter(r => r.status !== "completed").length;
    const completedReview = state.reviews.filter(r => r.status === "completed").length;

    const cards = [
      { label: "总项目数", value: total, tag: "健康", cls: "" },
      { label: "高风险项目", value: highRisk, tag: "需关注", cls: highRisk > 0 ? "danger" : "success" },
      { label: "待复核项", value: pendingReview, tag: "待处理", cls: pendingReview > 0 ? "warning" : "success" },
      { label: "已完成项", value: completedReview, tag: "已完成", cls: "success" },
    ];
    const root = $("#stat-cards");
    root.innerHTML = "";
    for (const c of cards) {
      root.appendChild(el("div", { class: `stat ${c.cls}` },
        el("div", { class: "stat-label" }, c.label),
        el("div", { class: "stat-value" }, String(c.value)),
        el("span", { class: "stat-tag" }, c.tag),
      ));
    }

    // 高风险列表（按 riskCount 降序）
    const top = [...projects].sort((a, b) => b.riskCount - a.riskCount).slice(0, 4);
    const list = $("#high-risk-list");
    list.innerHTML = "";
    for (const p of top) {
      list.appendChild(el("div", { class: "project-item" },
        el("div", { class: "project-head" },
          el("div", {},
            el("span", { class: "project-id" }, p.id),
            el("span", { class: "project-name" }, p.name),
          ),
          el("span", { class: `tag ${riskLabelColor(p.riskLevel)}` }, p.riskLevel + "风险"),
        ),
        el("div", { class: "project-meta" },
          `${p.type} · ${p.stage} · 质量问题 ${p.qualityIssues} · 满意度 ${p.satisfaction}`),
        el("div", { class: "risk-meters" },
          el("div", { class: "risk-meter-item" },
            el("span", {}, `成本使用率 ${p.costUsage}%`),
            el("div", { class: "meter" }, el("div", {
              class: meterClass(p.costUsage),
              style: `width:${Math.min(p.costUsage, 130)}%`,
            })),
          ),
          el("div", { class: "risk-meter-item" },
            el("span", {}, `周期使用率 ${p.cycleUsage}%`),
            el("div", { class: "meter" }, el("div", {
              class: meterClass(p.cycleUsage),
              style: `width:${Math.min(p.cycleUsage, 130)}%`,
            })),
          ),
        ),
      ));
    }

    // 动态列表
    const act = $("#activity");
    act.innerHTML = "";
    const events = [
      { t: "刚刚", m: `已加载 ${total} 个项目数据`, cls: "ok" },
      { t: "1 分钟前", m: "风险指标计算完成", cls: "ok" },
      { t: "2 分钟前", m: "AI 诊断服务已就绪", cls: "ok" },
      ...top.slice(0, 2).map(p => ({ t: "本周", m: `${p.id} ${p.name} 风险级别：${p.riskLevel}`, cls: p.riskLevel === "高" ? "w" : "ok" })),
    ];
    for (const e of events) {
      const node = el("li", {},
        el("div", {}, el("div", { class: "t" }, e.t), el("div", {}, e.m)),
      );
      if (e.cls === "w") node.style.borderLeftColor = "var(--warning)";
      act.appendChild(node);
    }

    // 侧边栏项目计数
    $("#project-count").textContent = `${total} 个项目 · ${highRisk} 个高风险`;
  }

  // ---------- 风险看板 ----------
  let riskFilter = "all", riskSort = "risk";
  function renderRiskPage() {
    // 风险指标小卡
    const costs = state.projects.map(p => p.costUsage);
    const cycles = state.projects.map(p => p.cycleUsage);
    const avgC = (costs.reduce((a, b) => a + b, 0) / costs.length).toFixed(1);
    const avgCy = (cycles.reduce((a, b) => a + b, 0) / cycles.length).toFixed(1);
    const maxCost = Math.max(...costs).toFixed(1);
    const avgSat = (state.projects.reduce((s, p) => s + p.satisfaction, 0) / state.projects.length).toFixed(2);

    const cards = [
      { label: "平均成本使用率(%)", value: avgC, tag: "低于 90% 为安全", cls: parseFloat(avgC) > 90 ? "warning" : "" },
      { label: "平均周期使用率(%)", value: avgCy, tag: "低于 90% 为安全", cls: parseFloat(avgCy) > 90 ? "warning" : "" },
      { label: "最高成本使用率(%)", value: maxCost, tag: "关注", cls: parseFloat(maxCost) > 100 ? "danger" : "warning" },
      { label: "平均满意度", value: avgSat, tag: "≥ 3.8 健康", cls: parseFloat(avgSat) < 3.8 ? "warning" : "" },
    ];
    const root = $("#risk-metrics");
    root.innerHTML = "";
    cards.forEach(c => root.appendChild(
      el("div", { class: `stat ${c.cls}` },
        el("div", { class: "stat-label" }, c.label),
        el("div", { class: "stat-value" }, String(c.value)),
        el("span", { class: "stat-tag" }, c.tag),
      )
    ));

    // 成本 柱形图
    buildBarChart("#chart-cost", state.projects.map(p => ({
      l: p.id,
      v: p.costUsage,
      cls: p.costUsage > 110 ? "danger" : p.costUsage > 90 ? "warning" : "success",
    })));

    buildBarChart("#chart-cycle", state.projects.map(p => ({
      l: p.id,
      v: p.cycleUsage,
      cls: p.cycleUsage > 95 ? "danger" : p.cycleUsage > 85 ? "warning" : "success",
    })));

    // 表格
    renderRiskTable();
  }
  function renderRiskTable() {
    const body = $("#risk-table-body");
    body.innerHTML = "";
    let rows = [...state.projects];
    if (riskFilter !== "all") {
      rows = rows.filter(r => r.riskLevel === riskFilter);
    }
    if (riskSort === "risk") rows.sort((a, b) => b.riskCount - a.riskCount);
    if (riskSort === "cost") rows.sort((a, b) => b.costUsage - a.costUsage);
    if (riskSort === "cycle") rows.sort((a, b) => b.cycleUsage - a.cycleUsage);
    if (riskSort === "quality") rows.sort((a, b) => b.qualityIssues - a.qualityIssues);
    for (const p of rows) {
      body.appendChild(el("tr", {},
        el("td", { class: "num" }, p.id),
        el("td", {}, p.name),
        el("td", {}, p.type),
        el("td", {}, p.stage),
        el("td", { class: "num" }, `${p.costUsage}%`),
        el("td", { class: "num" }, `${p.cycleUsage}%`),
        el("td", { class: "num" }, String(p.qualityIssues)),
        el("td", { class: "num" }, String(p.satisfaction)),
        el("td", {}, el("span", { class: `tag ${riskLabelColor(p.riskLevel)}` }, p.riskLevel)),
      ));
    }
    if (rows.length === 0) {
      body.appendChild(el("tr", {}, el("td", { colspan: 9, style: "padding:20px;text-align:center;color:var(--muted);" }, "没有匹配项目")));
    }
  }

  function buildBarChart(sel, data) {
    const root = $(sel);
    root.innerHTML = "";
    const max = Math.max(...data.map(d => d.v), 100);
    for (const d of data) {
      const h = Math.min(d.v / max, 1) * 100;
      root.appendChild(el("div", { class: `bar ${d.cls}` },
        el("div", { class: "bar-value" }, Math.round(d.v) + "%"),
        el("div", { class: "fill", style: `height:${h}%` }),
        el("div", { class: "bar-label" }, d.l),
      ));
    }
  }

  // ---------- 月报生成 ----------
  function renderReportPage() {
    const chips = $("#project-chips");
    chips.innerHTML = "";
    state.projects.forEach(p => {
      const chip = el("button", { class: "chip", onclick: () => {
        if (state.selectedProjects.has(p.id)) state.selectedProjects.delete(p.id);
        else state.selectedProjects.add(p.id);
        chip.classList.toggle("selected");
      } }, p.id + " " + p.name);
      chips.appendChild(chip);
    });
  }

  async function generateReport() {
    const btn = $("#gen-report");
    btn.disabled = true;
    btn.textContent = "⏳ 正在生成…";
    try {
      const data = await postJSON("/api/report/generate", {
        projectIds: state.selectedProjects.size > 0 ? [...state.selectedProjects] : null,
        type: $("#report-type").value,
      });
      state.reportText = data.content;
      $("#report-content").textContent = data.content;
      $("#report-result").classList.remove("hidden");
    } catch (e) {
      alert("生成失败：" + e.message);
    } finally {
      btn.disabled = false;
      btn.innerHTML = "🚀 生成报告";
    }
  }

  function downloadReport() {
    const blob = new Blob([state.reportText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "项目管理诊断报告-" + new Date().toISOString().slice(0, 10) + ".md";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- 人工复核 ----------
  function renderReviewPage() {
    const pending = state.reviews.filter(r => r.status !== "completed").length;
    const inpro = state.reviews.filter(r => r.status === "in_progress").length;
    const done = state.reviews.filter(r => r.status === "completed").length;
    $("#review-stats").innerHTML = "";
    const cards = [
      { label: "总复核项", value: state.reviews.length, tag: "所有", cls: "" },
      { label: "待处理", value: pending, tag: "待处理", cls: pending ? "warning" : "success" },
      { label: "进行中", value: inpro, tag: "进行中", cls: "warning" },
      { label: "已完成", value: done, tag: "已完成", cls: "success" },
    ];
    cards.forEach(c => $("#review-stats").appendChild(
      el("div", { class: `stat ${c.cls}` },
        el("div", { class: "stat-label" }, c.label),
        el("div", { class: "stat-value" }, String(c.value)),
        el("span", { class: "stat-tag" }, c.tag),
      )
    ));

    const f = $("#review-filter").value;
    const list = $("#review-list");
    list.innerHTML = "";
    const items = f === "all" ? state.reviews : state.reviews.filter(r => r.status === f);
    if (items.length === 0) {
      list.appendChild(el("div", { style: "padding:30px;text-align:center;color:var(--muted);" }, "暂无复核项"));
      return;
    }
    for (const r of items) {
      const statusText = r.status === "pending" ? "待处理" : r.status === "in_progress" ? "进行中" : "已完成";
      const statusCls = r.status === "pending" ? "tag-mid" : r.status === "in_progress" ? "tag-high" : "tag-low";
      list.appendChild(el("div", { class: `review-item ${r.status === "completed" ? "completed" : ""}` },
        el("div", { class: "review-head" },
          el("div", { class: "review-title" },
            el("span", { class: "project-id" }, r.projectId),
            r.content,
          ),
          el("div", {},
            el("span", { class: "tag tag-info" }, "优先级 " + r.priority),
            " ",
            el("span", { class: `tag ${statusCls}` }, statusText),
          ),
        ),
        el("div", { class: "review-meta" }, `${r.projectName} · ${r.type} · 责任人：${r.assignee} · 截止：${r.dueDate}`),
        el("div", { class: "review-reason" }, "📍 " + r.reason),
        el("div", { class: "review-foot" },
          el("span", {}, r.assignee),
          el("button", {
            class: "btn",
            onclick: async () => {
              try {
                const updated = await postJSON("/api/review/toggle", { id: r.id });
                const idx = state.reviews.findIndex(x => x.id === r.id);
                if (idx >= 0) state.reviews[idx] = updated;
                renderReviewPage();
                renderDashboard();
              } catch (e) { alert("操作失败"); }
            },
          }, r.status === "completed" ? "↺ 恢复为待处理" : "✔ 标记完成"),
        ),
      ));
    }
  }

  // ---------- AI 对话 ----------
  function renderChatPage() {
    // 更新指标速查
    const total = state.projects.length;
    const high = state.projects.filter(p => p.riskCount >= 2).length;
    const avgCost = (state.projects.reduce((s, p) => s + p.costUsage, 0) / total).toFixed(1);
    const avgSat = (state.projects.reduce((s, p) => s + p.satisfaction, 0) / total).toFixed(2);
    const data = [
      { l: "总项目", v: total },
      { l: "高风险项目", v: high },
      { l: "平均成本(%)", v: avgCost },
      { l: "平均满意度", v: avgSat },
    ];
    const root = $("#ai-stats");
    root.innerHTML = "";
    data.forEach(d => root.appendChild(
      el("div", { class: "chip-stat" },
        el("div", { class: "label" }, d.l),
        el("div", { class: "value" }, String(d.v)),
      )
    ));
  }

  function appendChatMsg(role, text) {
    const log = $("#chat-log");
    const msg = el("div", { class: `chat-msg ${role}` },
      el("div", { class: "chat-avatar" }, role === "user" ? "👤" : "🤖"),
      el("div", { class: "chat-bubble" }, text),
    );
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
  }

  async function sendChat(text) {
    if (!text.trim()) return;
    appendChatMsg("user", text);
    $("#chat-input").value = "";
    const sendBtn = $("#chat-send");
    sendBtn.disabled = true; sendBtn.textContent = "思考中…";
    try {
      const data = await postJSON("/api/ai/chat", { message: text });
      appendChatMsg("bot", data.response);
    } catch (e) {
      appendChatMsg("bot", "抱歉，AI 服务暂时不可用：" + e.message);
    } finally {
      sendBtn.disabled = false; sendBtn.textContent = "发送";
    }
  }

  // ---------- 数据导入 ----------
  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const delim = lines[0].includes("\t") ? "\t" : ",";
    const header = lines[0].split(delim).map(s => s.trim());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const cols = lines[i].split(delim).map(s => s.trim());
      const obj = {};
      header.forEach((h, idx) => obj[h] = cols[idx]);
      rows.push(obj);
    }
    return { header, rows };
  }

  function fileToProjects({ rows }) {
    // 将 CSV 字段映射到内部字段
    const map = {
      "项目编号": "id", "项目名称": "name", "类型": "type",
      "阶段": "stage", "预算(万)": "budget", "已发生成本(万)": "cost",
      "计划天数": "planDays", "已用天数": "usedDays",
      "质量问题": "qualityIssues", "满意度": "satisfaction",
    };
    return rows.map(r => {
      const p = {};
      for (const [k, v] of Object.entries(r)) {
        if (map[k] !== undefined) {
          const key = map[k];
          p[key] = (["budget", "cost", "planDays", "usedDays", "qualityIssues", "satisfaction"].includes(key))
            ? parseFloat(v) || 0 : v;
        }
      }
      // 自动补齐
      p.type = p.type || "其他";
      p.stage = p.stage || "启动";
      p.riskLevel = "低";
      if (p.satisfaction === 0) p.satisfaction = 4.0;
      return p;
    });
  }

  function handleFileSelect(file) {
    if (!file) return;
    $("#file-info").classList.remove("hidden");
    $("#file-info").textContent = `📄 ${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      state.pendingRows = fileToProjects(parsed);
      // 预览表
      const table = $("#import-table");
      table.innerHTML = "";
      const thead = el("thead", {},
        el("tr", {},
          ...["项目编号", "项目名称", "类型", "阶段", "预算", "已发生成本", "计划天数", "已用天数", "质量问题", "满意度"]
            .map(h => el("th", {}, h)),
        ),
      );
      const tbody = el("tbody", {},
        ...state.pendingRows.slice(0, 6).map(r => el("tr", {},
          el("td", { class: "num" }, r.id || "-"),
          el("td", {}, r.name || "-"),
          el("td", {}, r.type || "-"),
          el("td", {}, r.stage || "-"),
          el("td", { class: "num" }, String(r.budget || 0)),
          el("td", { class: "num" }, String(r.cost || 0)),
          el("td", { class: "num" }, String(r.planDays || 0)),
          el("td", { class: "num" }, String(r.usedDays || 0)),
          el("td", { class: "num" }, String(r.qualityIssues || 0)),
          el("td", { class: "num" }, String(r.satisfaction || 0)),
        ))
      );
      table.appendChild(thead); table.appendChild(tbody);
      $("#import-preview").classList.remove("hidden");
    };
    reader.readAsText(file, "utf-8");
  }

  async function confirmImport() {
    if (!state.pendingRows || state.pendingRows.length === 0) return;
    const data = await postJSON("/api/projects/import", { projects: state.pendingRows });
    $("#import-result").classList.remove("hidden");
    $("#import-result").textContent = `✅ 成功导入 ${data.count} 个项目`;
    // 重新加载
    await loadAll();
  }

  function downloadTemplate() {
    const header = "项目编号,项目名称,类型,阶段,预算(万),已发生成本(万),计划天数,已用天数,质量问题,满意度\n";
    const sample = "P901,示例项目-智能客服,科技服务,执行中,120,80,90,45,2,4.3\nP902,示例项目-安全咨询,咨询交付,启动,80,10,60,5,1,4.5\n";
    const blob = new Blob(["\ufeff" + header + sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "项目数据导入模板.csv";
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  // ---------- 初始加载 ----------
  async function loadAll() {
    try {
      const [projects, reviews] = await Promise.all([
        getJSON("/api/projects"),
        getJSON("/api/review"),
      ]);
      state.projects = projects;
      state.reviews = reviews;
      renderDashboard();
      // 如果当前在某个页面，也重渲染它
      const cur = $$(".page").find(p => !p.classList.contains("hidden"));
      if (cur && cur.dataset.page !== "dashboard") switchPage(cur.dataset.page);
    } catch (e) {
      $("#project-count").textContent = "⚠ 数据加载失败，请确认后端服务是否运行";
      alert("数据加载失败：" + e.message);
    }
  }

  // ---------- 事件绑定 ----------
  function bindEvents() {
    $$(".menu-item").forEach(m => {
      m.addEventListener("click", () => switchPage(m.dataset.page));
    });
    $$(".action").forEach(btn => {
      btn.addEventListener("click", () => switchPage(btn.dataset.go));
    });

    // 风险筛选
    $("#filter-risk").addEventListener("change", (e) => { riskFilter = e.target.value; renderRiskTable(); });
    $("#sort-by").addEventListener("change", (e) => { riskSort = e.target.value; renderRiskTable(); });

    // 报告
    $("#gen-report").addEventListener("click", generateReport);
    $("#copy-report").addEventListener("click", () => {
      navigator.clipboard.writeText(state.reportText);
      $("#copy-report").textContent = "✔ 已复制";
      setTimeout(() => $("#copy-report").textContent = "📋 复制", 1500);
    });
    $("#download-report").addEventListener("click", downloadReport);

    // 复核筛选
    $("#review-filter").addEventListener("change", renderReviewPage);

    // 对话
    $("#chat-send").addEventListener("click", () => sendChat($("#chat-input").value));
    $("#chat-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendChat(e.target.value);
    });
    $$(".quick-questions .chip").forEach(ch => {
      ch.addEventListener("click", () => sendChat(ch.dataset.q));
    });

    // 文件导入
    const dz = $("#drop-zone");
    dz.addEventListener("click", () => $("#file-input").click());
    dz.addEventListener("dragover", (e) => { e.preventDefault(); dz.classList.add("drag-over"); });
    dz.addEventListener("dragleave", () => dz.classList.remove("drag-over"));
    dz.addEventListener("drop", (e) => {
      e.preventDefault(); dz.classList.remove("drag-over");
      if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    });
    $("#file-input").addEventListener("change", (e) => {
      if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    });
    $("#confirm-import").addEventListener("click", confirmImport);
    $("#download-template").addEventListener("click", downloadTemplate);
  }

  // ---------- 启动 ----------
  document.addEventListener("DOMContentLoaded", () => {
    bindEvents();
    switchPage("dashboard");
    loadAll();
  });
})();
