/* ============================================================
   作品数据 —— 两个页面共用这一个文件
   换成自己的照片：把 src 改成 "assets/photos/文件名.jpg"
   建议长边压到 2000px 以内、单张 400KB 左右，加载更快。
   ratio 可选：r-45 (4:5) / r-23 (2:3) / r-34 (3:4) / r-11 (1:1) / r-32 (3:2) / r-169 (16:9)
   ============================================================ */
(function () {
  "use strict";

  window.PHOTOS = [
    { src: 1015, title: "河谷 · 晨光",   cat: "风光", ratio: "r-45"  },
    { src: 1027, title: "逆光肖像",      cat: "人像", ratio: "r-23"  },
    { src: 1047, title: "夜行 · 天际线", cat: "城市", ratio: "r-32"  },
    { src: 1005, title: "侧光 · 工作室", cat: "人像", ratio: "r-45"  },
    { src: 1018, title: "雪线之上",      cat: "风光", ratio: "r-169" },
    { src: 1011, title: "湖上清晨",      cat: "纪实", ratio: "r-34"  },
    { src: 1036, title: "高原湖泊",      cat: "风光", ratio: "r-32"  },
    { src: 64,   title: "窗边的午后",    cat: "人像", ratio: "r-45"  },
    { src: 1039, title: "流水 · 长曝",   cat: "风光", ratio: "r-23"  },
    { src: 1019, title: "暮色湖岸",      cat: "风光", ratio: "r-11"  },
    { src: 1062, title: "市集一角",      cat: "纪实", ratio: "r-34"  },
    { src: 1044, title: "街角光影",      cat: "城市", ratio: "r-45"  }
  ];

  window.CATEGORIES = ["全部", "人像", "风光", "城市", "纪实"];

  /* 数字 = 示例图床；字符串 = 你自己的图片路径 */
  window.photoUrl = function (src, width) {
    if (typeof src === "number") {
      return "https://picsum.photos/id/" + src + "/" + width + "/" + Math.round(width * 0.75);
    }
    return src;
  };

  window.escHtml = function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  window.tileHtml = function (photo, index) {
    var alt = photo.title + " — " + photo.cat + "摄影作品";
    return '<figure class="tile reveal ' + photo.ratio + '" ' +
        'data-index="' + index + '" tabindex="0" role="button" ' +
        'aria-label="查看作品：' + window.escHtml(photo.title) + '">' +
        '<img src="' + window.photoUrl(photo.src, 800) + '" alt="' + window.escHtml(alt) + '" loading="lazy" decoding="async" />' +
        '<figcaption class="tile-meta">' +
          '<span><strong>' + window.escHtml(photo.title) + '</strong><small>' + window.escHtml(photo.cat) + '</small></span>' +
          '<span class="cat">' + window.escHtml(photo.cat) + '</span>' +
        '</figcaption>' +
      '</figure>';
  };
})();
