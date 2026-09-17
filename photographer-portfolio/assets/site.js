/* ============================================================
   公共交互：导航、滚动高亮、滚动入场、作品渲染、灯箱
   首页与作品页共用，修改一次两边同时生效。
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 顶部导航 ---------- */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var mobilePanel = document.getElementById("mobilePanel");

  if (nav && navToggle && mobilePanel) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    });
    mobilePanel.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (nav) {
    var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 24); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- 滚动时高亮当前栏目 ---------- */
  function initScrollSpy() {
    var links = Array.prototype.filter.call(
      document.querySelectorAll('.nav-menu a[href^="#"], .mobile-panel a[href^="#"]'),
      function (a) { return a.getAttribute("href").length > 1; }
    );
    if (!links.length || !("IntersectionObserver" in window)) return;

    var sections = [];
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el && sections.indexOf(el) === -1) sections.push(el);
    });
    if (!sections.length) return;

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var hash = "#" + entry.target.id;
        links.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === hash);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });

    sections.forEach(function (el) { spy.observe(el); });
  }

  /* ---------- 滚动入场 ---------- */
  var observer = null;

  function observeReveal() {
    var items = document.querySelectorAll(".reveal:not(.in)");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("in"); });
      return;
    }
    if (!observer) {
      observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    }
    Array.prototype.forEach.call(items, function (el) { observer.observe(el); });
  }

  /* ---------- 灯箱 ---------- */
  var lb = document.getElementById("lightbox");
  var lbImage = document.getElementById("lbImage");
  var lbTitle = document.getElementById("lbTitle");
  var lbMeta = document.getElementById("lbMeta");
  var lbCounter = document.getElementById("lbCounter");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");

  var list = [];
  var index = 0;
  var lastFocused = null;

  function pad(n) { return n < 10 ? "0" + n : String(n); }

  /* 预加载相邻图片，切换时不会闪白 */
  function preload(target) {
    if (target < 0 || target >= list.length) return;
    var photo = list[target];
    if (!photo) return;
    var img = new Image();
    img.src = window.photoUrl(photo.src, 1600);
  }

  var paintToken = 0;

  function paint() {
    var photo = list[index];
    if (!photo) return;

    /* 换图时做一次交叉淡入，避免直接闪切 */
    var token = ++paintToken;
    lbImage.style.opacity = "0";
    lbImage.onload = function () {
      if (token === paintToken) lbImage.style.opacity = "1";
    };
    lbImage.src = window.photoUrl(photo.src, 1600);
    lbImage.alt = photo.title + " — " + photo.cat + "摄影作品";
    lbTitle.textContent = photo.title;
    lbMeta.textContent = photo.cat + " · 沈砚摄影 · " + pad(index + 1) + "/" + pad(list.length);
    lbCounter.textContent = (index + 1) + " / " + list.length;
    preload(index + 1);
    preload(index - 1);
  }

  function openLightbox(nextList, nextIndex) {
    if (!lb || !nextList.length) return;
    list = nextList;
    index = nextIndex;
    lastFocused = document.activeElement;
    paint();
    lb.classList.add("open");
    document.body.style.overflow = "hidden";
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    if (!lb) return;
    lb.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function stepLightbox(delta) {
    if (!list.length) return;
    index = (index + delta + list.length) % list.length;
    paint();
  }

  if (lb) {
    if (lbClose) lbClose.addEventListener("click", closeLightbox);
    if (lbPrev) lbPrev.addEventListener("click", function () { stepLightbox(-1); });
    if (lbNext) lbNext.addEventListener("click", function () { stepLightbox(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

    /* 键盘：方向键切换、Esc 关闭、Tab 焦点锁在灯箱内 */
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;

      if (e.key === "Escape") { closeLightbox(); return; }
      if (e.key === "ArrowLeft") { stepLightbox(-1); return; }
      if (e.key === "ArrowRight") { stepLightbox(1); return; }

      if (e.key === "Tab") {
        var stops = [lbClose, lbPrev, lbNext].filter(Boolean);
        if (!stops.length) return;
        var first = stops[0];
        var last = stops[stops.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });

    /* 触屏左右滑动切换 */
    var startX = null, startY = null;
    lb.addEventListener("touchstart", function (e) {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    lb.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - startX;
      var dy = touch.clientY - startY;
      startX = null;
      startY = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        stepLightbox(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  /* ---------- 渲染作品图块 ---------- */
  function renderTiles(container, items) {
    if (!container) return;

    container.innerHTML = items.map(function (photo, i) {
      return window.tileHtml(photo, i);
    }).join("");

    container.onclick = function (e) {
      var tile = e.target.closest(".tile");
      if (tile) openLightbox(items, Number(tile.getAttribute("data-index")));
    };
    container.onkeydown = function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var tile = e.target.closest(".tile");
      if (tile) {
        e.preventDefault();
        openLightbox(items, Number(tile.getAttribute("data-index")));
      }
    };

    observeReveal();
  }

  window.Site = {
    renderTiles: renderTiles,
    observeReveal: observeReveal,
    openLightbox: openLightbox,
    closeLightbox: closeLightbox
  };

  initScrollSpy();
  observeReveal();
})();

/* ---------- 影像助手：无需后端的基础问答 ---------- */
(function () {
  "use strict";

  var faq = [
    {
      keys: ["价格", "多少钱", "报价", "费用", "收费"],
      answer: "目前常见套餐：个人写真 ¥980 起，商业拍摄 ¥3200 起，旅拍随行 ¥1800 / 天。具体会根据时长、地点和交付内容确认。"
    },
    {
      keys: ["档期", "时间", "预约", "什么时候", "有空"],
      answer: "可以先填写预约信息，告诉我拍摄类型、城市和期望日期。我会在工作日 24 小时内回复档期与方案。"
    },
    {
      keys: ["拍摄类型", "类型", "写真", "商业", "旅拍", "活动"],
      answer: "主要提供个人写真、商业拍摄、旅拍随行和活动现场记录，也可以根据你的需求定制拍摄方案。"
    },
    {
      keys: ["地点", "城市", "杭州", "外派", "在哪里", "全国"],
      answer: "常驻杭州，可在长三角及全国范围内拍摄。异地拍摄的差旅费用会根据实际行程另行确认。"
    },
    {
      keys: ["照片", "成片", "交付", "精修", "原片", "多久"],
      answer: "基础套餐包含精修照片和原始文件。具体交付数量与时间会根据拍摄类型、片量和后期需求确定。"
    },
    {
      keys: ["联系", "微信", "邮箱", "电话", "怎么找"],
      answer: "邮箱：hello@shenyan.photo；电话 / 微信：138 0000 0000。也可以直接进入预约页面提交拍摄需求。"
    }
  ];

  function answerFor(text) {
    var input = String(text || "").toLowerCase();
    for (var i = 0; i < faq.length; i++) {
      for (var k = 0; k < faq[i].keys.length; k++) {
        if (input.indexOf(faq[i].keys[k].toLowerCase()) > -1) return faq[i].answer;
      }
    }
    return "我可以帮你了解价格、档期、拍摄类型、地点、交付方式和联系方式。也可以直接填写预约信息，让摄影师根据你的需求回复。";
  }

  function createAssistant() {
    if (document.getElementById("photoAssistant")) return;

    var root = document.createElement("aside");
    root.className = "photo-assistant";
    root.id = "photoAssistant";
    root.innerHTML =
      '<button class="assistant-launch" id="assistantLaunch" type="button" aria-label="打开影像助手" aria-expanded="false">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 18.5 4 21v-4.5A7.5 7.5 0 0 1 3 12a7.5 7.5 0 0 1 7.5-7.5h3A7.5 7.5 0 0 1 21 12v1a7.5 7.5 0 0 1-7.5 7.5H9.5L7 18.5Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>' +
        '<span>影像助手</span>' +
      '</button>' +
      '<section class="assistant-panel" id="assistantPanel" aria-label="影像助手对话" aria-hidden="true">' +
        '<div class="assistant-head"><div><strong>影像助手</strong><small>基础信息咨询 · 不保存对话</small></div><button class="assistant-close" id="assistantClose" type="button" aria-label="关闭影像助手">×</button></div>' +
        '<div class="assistant-messages" id="assistantMessages" aria-live="polite"></div>' +
        '<div class="assistant-quick" id="assistantQuick">' +
          '<button type="button" data-question="个人写真多少钱？">价格</button>' +
          '<button type="button" data-question="最近有档期吗？">档期</button>' +
          '<button type="button" data-question="可以去外地拍摄吗？">地点</button>' +
        '</div>' +
        '<form class="assistant-form" id="assistantForm"><input id="assistantInput" type="text" maxlength="240" autocomplete="off" placeholder="问问拍摄价格、档期…" aria-label="输入问题" /><button type="submit" aria-label="发送问题"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 12 16-8-5 16-3-7-8-1Z"/><path d="m12 13 8-9"/></svg></button></form>' +
      '</section>';
    document.body.appendChild(root);

    var launch = document.getElementById("assistantLaunch");
    var panel = document.getElementById("assistantPanel");
    var close = document.getElementById("assistantClose");
    var messages = document.getElementById("assistantMessages");
    var form = document.getElementById("assistantForm");
    var input = document.getElementById("assistantInput");
    var quick = document.getElementById("assistantQuick");

    function addMessage(text, type) {
      var message = document.createElement("div");
      message.className = "assistant-message " + type;
      message.textContent = text;
      messages.appendChild(message);
      messages.scrollTop = messages.scrollHeight;
    }

    function open() {
      root.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      launch.setAttribute("aria-expanded", "true");
      if (!messages.children.length) addMessage("你好，我可以回答拍摄价格、档期、类型、地点和交付方式等基础问题。", "assistant");
      input.focus();
    }

    function closePanel() {
      root.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      launch.setAttribute("aria-expanded", "false");
      launch.focus();
    }

    function send(text) {
      var value = String(text || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 240);
      if (!value) return;
      addMessage(value, "user");
      input.value = "";
      window.setTimeout(function () { addMessage(answerFor(value), "assistant"); }, 260);
    }

    launch.addEventListener("click", function () {
      if (root.classList.contains("is-open")) closePanel(); else open();
    });
    close.addEventListener("click", closePanel);
    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); });
    quick.addEventListener("click", function (e) {
      var button = e.target.closest("button[data-question]");
      if (button) send(button.getAttribute("data-question"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("is-open")) closePanel();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", createAssistant);
  else createAssistant();
})();
