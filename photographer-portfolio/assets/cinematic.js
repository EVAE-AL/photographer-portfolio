/* ============================================================
   首屏视频背景：手写淡入淡出循环
   - requestAnimationFrame 持续读取 currentTime 与 duration
   - 开头 0.5s 淡入，结尾前 0.5s 淡出
   - ended 时置 0 透明度，等 100ms 把 currentTime 归零后重新播放
   ============================================================ */
(function () {
  "use strict";

  var video = document.getElementById("heroVideo");
  if (!video) return;

  var FADE = 0.5;
  var rafId = null;
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp01(value) {
    if (value < 0) return 0;
    if (value > 1) return 1;
    return value;
  }

  function tick() {
    var duration = video.duration;
    var time = video.currentTime;

    if (duration && isFinite(duration)) {
      var remaining = duration - time;
      var opacity;
      if (time < FADE) {
        opacity = clamp01(time / FADE);
      } else if (remaining < FADE) {
        opacity = clamp01(remaining / FADE);
      } else {
        opacity = 1;
      }
      video.style.opacity = String(opacity);
    }

    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId === null) rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function play() {
    var promise = video.play();
    if (promise && typeof promise.catch === "function") {
      promise.catch(function () {
        video.style.opacity = "1";
        stopLoop();
      });
    }
  }

  video.addEventListener("error", function () {
    video.style.opacity = "1";
    stopLoop();
  });

  video.addEventListener("ended", function () {
    video.style.opacity = "0";
    stopLoop();
    window.setTimeout(function () {
      video.currentTime = 0;
      play();
      startLoop();
    }, 100);
  });

  function boot() {
    if (reduced) {
      video.style.opacity = "1";
      video.pause();
      return;
    }
    video.style.opacity = "0";
    play();
    startLoop();
  }

  if (video.readyState >= 2) {
    boot();
  } else {
    video.addEventListener("loadeddata", boot, { once: true });
  }
})();

/* ============================================================
   首屏视差：鼠标轻微跟随，滚动时画面缓慢位移、文字淡出
   ============================================================ */
(function () {
  "use strict";

  var hero = document.querySelector(".hero");
  if (!hero) return;

  var video = document.getElementById("heroVideo");
  var copy = hero.querySelector(".hero-copy");
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
  var targetX = 0, targetY = 0, currentX = 0, currentY = 0, scrollOffset = 0;
  var frameId = null;

  function render() {
    frameId = null;

    currentX += (targetX - currentX) * 0.09;
    currentY += (targetY - currentY) * 0.09;

    if (video) {
      video.style.transform = "translate3d(" + currentX.toFixed(2) + "px," +
        (currentY + scrollOffset).toFixed(2) + "px,0) scale(1.07)";
    }

    if (Math.abs(targetX - currentX) > 0.12 || Math.abs(targetY - currentY) > 0.12) {
      schedule();
    }
  }

  function schedule() {
    if (frameId === null) frameId = requestAnimationFrame(render);
  }

  if (finePointer) {
    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 28;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 18;
      schedule();
    });
    hero.addEventListener("pointerleave", function () {
      targetX = 0;
      targetY = 0;
      schedule();
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var viewport = window.innerHeight || 1;
      var progress = Math.min(window.scrollY / viewport, 1.2);
      scrollOffset = progress * 16;
      if (copy) {
        copy.style.opacity = String(Math.max(0, 1 - progress * 1.7));
        copy.style.transform = "translate3d(0," + (progress * 48).toFixed(1) + "px,0)";
      }
      schedule();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

/* ============================================================
   预约表单：逐项校验 + 转成本机邮件
   ============================================================ */
(function () {
  "use strict";

  var form = document.getElementById("bookingForm");
  if (!form) return;

  var note = document.getElementById("formNote");
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var LIMITS = { name: 40, contact: 120, city: 80, message: 1000 };

  /* 部署 Cloudflare Worker 后，把它的地址填在这里；留空则退回本机邮件。 */
  var FORM_ENDPOINT = "https://booking-relay.shenyan-studio.workers.dev";
  var FALLBACK_MAIL = "hello@shenyan.photo";

  function limited(value, max) {
    return String(value || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
  }

  function fieldOf(input) { return input ? input.closest(".field") : null; }

  function setError(input, message) {
    var field = fieldOf(input);
    if (!field) return;
    field.classList.toggle("has-error", Boolean(message));

    var tip = field.querySelector(".field-error");
    if (!message) {
      if (tip) tip.textContent = "";
      return;
    }
    if (!tip) {
      tip = document.createElement("p");
      tip.className = "field-error";
      field.appendChild(tip);
    }
    tip.textContent = message;
  }

  form.addEventListener("input", function (e) {
    if (e.target.matches("input, textarea, select")) setError(e.target, "");
  });

  function setNote(message, ok) {
    note.textContent = message;
    note.style.color = ok === false ? "#B4451F" : "#6F6F6F";
  }

  function pretendSuccess() {
    form.reset();
    setNote("已收到你的预约信息，我会尽快回复。", true);
  }

  function sendByMail(payload) {
    var lines = [
      "称呼：" + payload.name,
      "联系方式：" + payload.contact,
      "拍摄类型：" + payload.type,
      "期望日期：" + (payload.date || "未填写"),
      "拍摄城市：" + (payload.city || "未填写"),
      "",
      "需求描述：",
      payload.message || "未填写"
    ];

    window.location.href = "mailto:" + FALLBACK_MAIL + "?subject=" +
      encodeURIComponent("拍摄预约 - " + payload.name) +
      "&body=" + encodeURIComponent(lines.join(String.fromCharCode(10)));

    setNote("已调用邮件客户端；如果没有反应，请直接发邮件到 " + FALLBACK_MAIL + "。", true);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var honey = form.querySelector('input[name="website"]');
    if (honey && honey.value) {
      pretendSuccess();
      return;
    }

    var nameEl = document.getElementById("fName");
    var contactEl = document.getElementById("fContact");
    var dateEl = document.getElementById("fDate");

    var name = limited(nameEl.value, LIMITS.name);
    var contact = limited(contactEl.value, LIMITS.contact);
    var cityEl = document.getElementById("fCity");
    var messageEl = document.getElementById("fMsg");
    var city = limited(cityEl ? cityEl.value : "", LIMITS.city);
    var message = limited(messageEl ? messageEl.value : "", LIMITS.message);
    nameEl.value = name;
    contactEl.value = contact;
    if (cityEl) cityEl.value = city;
    if (messageEl) messageEl.value = message;
    var firstBad = null;

    if (!name) {
      setError(nameEl, "请填写称呼");
      firstBad = firstBad || nameEl;
    }

    if (!contact) {
      setError(contactEl, "请填写邮箱或微信");
      firstBad = firstBad || contactEl;
    } else if (contact.indexOf("@") > -1 && !EMAIL.test(contact)) {
      setError(contactEl, "邮箱格式看起来不太对");
      firstBad = firstBad || contactEl;
    }

    if (dateEl.value) {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(dateEl.value + "T00:00:00") < today) {
        setError(dateEl, "日期已经过去了");
        firstBad = firstBad || dateEl;
      }
    }

    if (firstBad) {
      firstBad.focus();
      note.textContent = "还有几项需要补一下。";
      note.style.color = "#B4451F";
      return;
    }

    var data = new FormData(form);
    var payload = {
      name: name,
      contact: contact,
      type: data.get("type"),
      date: data.get("date") || "",
      city: city,
      message: message
    };

    if (!FORM_ENDPOINT) {
      sendByMail(payload);
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;
    setNote("正在发送…", true);

    var settled = false;
    var timer = setTimeout(function () {
      finish("发送超时了，请直接发邮件到 " + FALLBACK_MAIL + "。", false);
    }, 15000);

    function finish(message, ok) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (submitBtn) submitBtn.disabled = false;
      if (ok) form.reset();
      setNote(message, ok);
    }

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      if (!response.ok) throw new Error("HTTP " + response.status);
      finish("已收到你的预约信息，我会尽快回复。", true);
    }).catch(function () {
      finish("发送失败了，请直接发邮件到 " + FALLBACK_MAIL + "。", false);
    });
  });
})();

/* ============================================================
   自定义下拉框：原生 select 的弹出层无法用 CSS 改，
   这里换成按钮 + listbox，支持键盘与点击外部关闭。
   ============================================================ */
(function () {
  "use strict";

  var box = document.getElementById("typeSelect");
  if (!box) return;

  var trigger = document.getElementById("typeTrigger");
  var valueEl = document.getElementById("typeValue");
  var menu = document.getElementById("typeMenu");
  var hidden = box.querySelector('input[type="hidden"]');
  var options = Array.prototype.slice.call(box.querySelectorAll(".select-option"));
  var activeIndex = 0;

  function indexOfSelected() {
    for (var i = 0; i < options.length; i++) {
      if (options[i].getAttribute("aria-selected") === "true") return i;
    }
    return 0;
  }

  function isOpen() { return box.classList.contains("open"); }

  function highlight(i) {
    activeIndex = (i + options.length) % options.length;
    for (var n = 0; n < options.length; n++) {
      options[n].classList.toggle("is-active", n === activeIndex);
    }
    if (options[activeIndex].scrollIntoView) {
      options[activeIndex].scrollIntoView({ block: "nearest" });
    }
  }

  function open() {
    box.classList.add("open");
    trigger.setAttribute("aria-expanded", "true");
    highlight(indexOfSelected());
  }

  function close() {
    box.classList.remove("open");
    trigger.setAttribute("aria-expanded", "false");
    for (var i = 0; i < options.length; i++) options[i].classList.remove("is-active");
  }

  function choose(option) {
    for (var i = 0; i < options.length; i++) {
      options[i].setAttribute("aria-selected", options[i] === option ? "true" : "false");
    }
    var value = option.getAttribute("data-value");
    valueEl.textContent = value;
    hidden.value = value;
    hidden.dispatchEvent(new Event("input", { bubbles: true }));
    close();
    trigger.focus();
  }

  trigger.addEventListener("click", function () {
    if (isOpen()) close(); else open();
  });

  trigger.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen()) { open(); return; }
      highlight(activeIndex + (e.key === "ArrowDown" ? 1 : -1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (isOpen()) choose(options[activeIndex]); else open();
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (isOpen()) close();
    }
  });

  menu.addEventListener("click", function (e) {
    var option = e.target.closest(".select-option");
    if (option) choose(option);
  });

  menu.addEventListener("mousemove", function (e) {
    var option = e.target.closest(".select-option");
    if (option) highlight(options.indexOf(option));
  });

  document.addEventListener("click", function (e) {
    if (isOpen() && !box.contains(e.target)) close();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen()) close();
  });
})();
