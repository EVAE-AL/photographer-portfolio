/**
 * 预约表单 -> 群机器人 代理
 *
 * 前端只把表单内容 POST 到这里，机器人密钥保存在 Worker 的环境变量里，
 * 永远不会出现在公开的前端代码中。
 *
 * 支持 kind: telegram | feishu | dingtalk | wecom | generic
 */

const LIMITS = { name: 40, contact: 120, type: 40, date: 20, city: 80, message: 1000 };

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function clean(value, max) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json; charset=utf-8" }, corsHeaders(origin))
  });
}

function shanghaiTime() {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date());
}

function buildText(fields) {
  return [
    "新的拍摄预约",
    "称呼：" + fields.name,
    "联系方式：" + fields.contact,
    "拍摄类型：" + (fields.type || "未填写"),
    "期望日期：" + (fields.date || "未填写"),
    "拍摄城市：" + (fields.city || "未填写"),
    "需求描述：" + (fields.message || "未填写"),
    "提交时间：" + shanghaiTime()
  ].join("\n");
}

async function sendToRobot(env, text) {
  const kind = (env.WEBHOOK_KIND || "").trim();
  const url = (env.WEBHOOK_URL || "").trim();

  if (!kind) throw new Error("未配置 WEBHOOK_KIND");

  if (kind === "telegram") {
    const token = (env.TELEGRAM_BOT_TOKEN || "").trim();
    const chatId = (env.TELEGRAM_CHAT_ID || "").trim();
    if (!token || !chatId) throw new Error("缺少 TELEGRAM_BOT_TOKEN 或 TELEGRAM_CHAT_ID");
    return fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true })
    });
  }

  if (!url) throw new Error("未配置 WEBHOOK_URL");

  let body;
  if (kind === "feishu") {
    body = { msg_type: "text", content: { text: text } };
  } else if (kind === "dingtalk") {
    body = { msgtype: "text", text: { content: text } };
  } else if (kind === "wecom") {
    body = { msgtype: "text", text: { content: text } };
  } else {
    body = { text: text };
  }

  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

export default {
  async fetch(request, env) {
    const origin = (env.ALLOWED_ORIGIN || "https://evae-al.github.io").trim();

    const startedAt = Date.now();

    // 来源校验：浏览器跨域请求一定带 Origin，不是本站就拒掉
    const requestOrigin = (request.headers.get("Origin") || "").trim();
    if (requestOrigin && requestOrigin !== origin) {
      return json({ ok: false, error: "origin_not_allowed" }, 403, origin);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // 临时诊断接口：浏览器打开 /diag，只报告配置与到飞书的连通性，不会发消息
    if (request.method === "GET") {
      const diagUrl = new URL(request.url);
      if (diagUrl.pathname === "/diag") {
        const rawUrl = (env.WEBHOOK_URL || "").trim();
        const info = {
          webhookKind: env.WEBHOOK_KIND || null,
          webhookUrlSet: rawUrl.length > 0,
          webhookUrlLength: rawUrl.length,
          webhookUrlPrefix: rawUrl.slice(0, 34) || null,
          webhookUrlHasWhitespace: /\s/.test(rawUrl),
          allowedOrigin: env.ALLOWED_ORIGIN || null,
          envKeys: Object.keys(env).sort()
        };
        const startedAt = Date.now();
        try {
          const probe = await fetch("https://open.feishu.cn/", { method: "GET" });
          info.feishuReachable = true;
          info.feishuStatus = probe.status;
        } catch (e) {
          info.feishuReachable = false;
          info.feishuError = String(e && e.message ? e.message : e).slice(0, 300);
        }
        info.feishuMs = Date.now() - startedAt;
        return new Response(JSON.stringify(info, null, 2), {
          status: 200,
          headers: { "Content-Type": "application/json; charset=utf-8" }
        });
      }
      return json({ ok: false, error: "method_not_allowed" }, 405, origin);
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405, origin);
    }

    let raw;
    try {
      const bodyText = await request.text();
      raw = bodyText ? JSON.parse(bodyText) : null;
    } catch (e) {
      return json({ ok: false, error: "invalid_json" }, 400, origin);
    }

    if (!raw || typeof raw !== "object") {
      return json({ ok: false, error: "invalid_payload" }, 400, origin);
    }

    // 蜜罐：真人看不见这个字段，填了就是机器人
    if (clean(raw.website, 100)) {
      return json({ ok: true }, 200, origin);
    }

    const fields = {
      name: clean(raw.name, LIMITS.name),
      contact: clean(raw.contact, LIMITS.contact),
      type: clean(raw.type, LIMITS.type),
      date: clean(raw.date, LIMITS.date),
      city: clean(raw.city, LIMITS.city),
      message: clean(raw.message, LIMITS.message)
    };

    if (!fields.name || !fields.contact) {
      return json({ ok: false, error: "missing_required" }, 400, origin);
    }

    if (fields.date && !/^\d{4}-\d{2}-\d{2}$/.test(fields.date)) {
      fields.date = "";
    }

    try {
      const response = await sendToRobot(env, buildText(fields));
      if (!response || !response.ok) {
        const detail = response ? await response.text() : "no response";
        return json({ ok: false, error: "upstream_failed", detail: detail.slice(0, 200) }, 502, origin);
      }
    } catch (e) {
      return json({ ok: false, error: "send_failed", detail: String(e.message || e).slice(0, 200) }, 500, origin);
    }

    console.log("relay ok in " + (Date.now() - startedAt) + "ms");
    return json({ ok: true, ms: Date.now() - startedAt }, 200, origin);
  }
};
