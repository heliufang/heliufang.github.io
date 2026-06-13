/**
 * Fang 主题主入口脚本
 * 包含：工具函数、主题切换、回到顶部、阅读进度、统计、代码块、TOC、搜索、分享、打赏
 */

(function(window) {
  'use strict';

  // ==========================================================================
  // 工具函数
  // ==========================================================================
  function debounce(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(context, args); }, delay);
    };
  }

  function throttle(fn, wait) {
    var last = 0;
    return function() {
      var now = Date.now();
      if (now - last > wait) { last = now; fn.apply(this, arguments); }
    };
  }

  function storageGet(key) {
    try { return window.localStorage.getItem(key); } catch (e) { return null; }
  }
  function storageSet(key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  }

  /**
   * 友好的运行时长（站点已运行 X）
   * - < 1 天：不足 1 天
   * - < 1 个月：X 天
   * - < 1 年：X 个月 Y 天
   * - >= 1 年：X 年 Y 个月 Z 天
   */
  function formatRunningTime(startDate) {
    var diff = Date.now() - startDate.getTime();
    if (diff < 86400000) return '不足 1 天';
    var totalDays = Math.floor(diff / 86400000);
    var years = Math.floor(totalDays / 365);
    var remainAfterYear = totalDays - years * 365;
    var months = Math.floor(remainAfterYear / 30);
    var days = remainAfterYear - months * 30;
    if (years > 0) {
      // 月份部分如果为 0 省略
      if (months === 0) return years + ' 年 ' + days + ' 天';
      if (days === 0) return years + ' 年 ' + months + ' 个月';
      return years + ' 年 ' + months + ' 个月 ' + days + ' 天';
    }
    if (months > 0) {
      if (days === 0) return months + ' 个月';
      return months + ' 个月 ' + days + ' 天';
    }
    return totalDays + ' 天';
  }

  /**
   * 相对时间格式化（如"几分钟前""几小时前""几天前"）
   * @param {Date|String|Number} input 时间
   * @returns {String} 相对时间文本；解析失败返回空串
   */
  function timeFromNow(input) {
    var date = input instanceof Date ? input : new Date(input);
    if (isNaN(date.getTime())) return '';
    var diff = Date.now() - date.getTime();
    if (diff < 0) diff = 0;
    var sec = Math.floor(diff / 1000);
    if (sec < 60) return '刚刚';
    var min = Math.floor(sec / 60);
    if (min < 60) return min + ' 分钟前';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' 小时前';
    var day = Math.floor(hr / 24);
    if (day < 30) return day + ' 天前';
    // 超过 30 天直接显示日期
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();
    return y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function highlightKeyword(text, keyword) {
    if (!keyword) return escapeHtml(text);
    var reg = new RegExp('(' + keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return escapeHtml(text).replace(reg, '<mark>$1</mark>');
  }

  window.FangUtils = {
    debounce: debounce, throttle: throttle,
    storageGet: storageGet, storageSet: storageSet,
    formatRunningTime: formatRunningTime,
    timeFromNow: timeFromNow,
    escapeHtml: escapeHtml, highlightKeyword: highlightKeyword
  };

  // ==========================================================================
  // 主题切换
  // ==========================================================================
  var THEME_KEY = 'fang-theme';
  var themeConfig = window.__THEME_CONFIG__ || {};

  function getResolvedTheme(theme) {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', getResolvedTheme(theme));
    storageSet(THEME_KEY, theme);
  }

  function toggleTheme() {
    var current = storageGet(THEME_KEY) || themeConfig.default || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ==========================================================================
  // 回到顶部 + 阅读进度
  // ==========================================================================
  function initBackToTop() {
    var btn = document.getElementById('back-to-top');
    if (!btn) return;
    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // 读取主题配置阈值（百分比），未配置则默认 20%
    var thresholdPct = (window.__THEME__ && window.__THEME__.backToTopThreshold);
    if (typeof thresholdPct !== 'number' || isNaN(thresholdPct)) thresholdPct = 20;
    var threshold = Math.max(0, Math.min(100, thresholdPct)) / 100;

    var onScroll = throttle(function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      // 文档不足以滚动时，滚动 300px 后就显示
      var ratio = docHeight > 0 ? (scrollTop / docHeight) : (scrollTop > 300 ? 1 : 0);
      // 同时支持"超过阈值"和"滚过 300px"两种判定
      if (ratio >= threshold || scrollTop > 300) btn.classList.add('show');
      else btn.classList.remove('show');
    }, 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // 初始化时执行一次
  }

  function initProgressBar() {
    var bar = document.getElementById('progress-bar');
    if (!bar) return;
    var update = throttle(function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (docHeight > 0 ? scrollTop / docHeight * 100 : 0) + '%';
    }, 16);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  // ==========================================================================
  // 移动端菜单
  // ==========================================================================
  function initMobileMenu() {
    var btn = document.getElementById('menu-toggle');
    var menu = document.getElementById('mobile-menu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function() { menu.classList.toggle('open'); });
  }

  // ==========================================================================
  // 代码块：语言标签 + 复制
  // ==========================================================================
  function initCodeBlocks() {
    var COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

    function fallbackCopy(text) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta); return ok;
      } catch (e) { return false; }
    }

    document.querySelectorAll('figure.highlight, pre').forEach(function(block) {
      if (block.dataset.processed) return;
      block.dataset.processed = '1';

      if (!block.querySelector('.code-lang')) {
        var cn = block.className || '';
        var m = cn.match(/highlight\s+([a-z0-9-]+)/i) || cn.match(/language-([a-z0-9-]+)/i);
        if (m && m[1] && !/plain|text/.test(m[1])) {
          var lbl = document.createElement('span');
          lbl.className = 'code-lang';
          lbl.textContent = m[1];
          block.appendChild(lbl);
        }
      }

      if (!block.querySelector('.copy-btn')) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-btn';
        btn.innerHTML = COPY_ICON + '<span>复制</span>';
        block.appendChild(btn);

        btn.addEventListener('click', function() {
          var code = block.querySelector('td.code pre code') ||
                     block.querySelector('pre code') ||
                     block.querySelector('pre') ||
                     block.querySelector('code');
          if (!code) return;
          var text = code.innerText;
          var onOk = function() {
            btn.classList.add('copied');
            btn.textContent = '已复制 ✓';
            setTimeout(function() {
              btn.classList.remove('copied');
              btn.innerHTML = COPY_ICON + '<span>复制</span>';
            }, 2000);
          };
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(onOk, function() {
              fallbackCopy(text) && onOk();
            });
          } else {
            fallbackCopy(text) && onOk();
          }
        });
      }
    });
  }

  // ==========================================================================
  // 文章目录
  // ==========================================================================
  function initToc() {
    var tocEl = document.getElementById('toc');
    var tocBody = document.getElementById('toc-body');
    var tocToggle = document.getElementById('toc-toggle');
    if (!tocEl || !tocBody) return;

    // 从 .post-content 内的 heading 动态构建目录
    var postContent = document.querySelector('.post-content');
    if (!postContent) return;

    var maxDepth = (window.__THEME__ && window.__THEME__.tocMaxDepth) || 3;
    var useOrdered = (window.__THEME__ && window.__THEME__.tocNumber) || false;

    // 1. 收集所有 heading
    var headingEls = Array.prototype.slice.call(
      postContent.querySelectorAll('h1, h2, h3, h4, h5, h6')
    );
    if (!headingEls.length) {
      tocBody.innerHTML = '<p class="toc-empty">本文暂无目录</p>';
      return;
    }

    // 2. 过滤 maxDepth，并跳过 h1（通常 h1 是文章标题，不计入目录）
    var headings = [];
    var slugCount = {};
    headingEls.forEach(function(el) {
      // 跳过顶级 h1（与文章标题重复）
      if (el.tagName === 'H1' && el.closest('.post-detail') &&
          el.parentElement.classList.contains('post-header')) return;
      var depth = parseInt(el.tagName.substring(1), 10);
      if (depth > maxDepth) return;

      // 3. 为 heading 生成/复用 id
      var id = el.id || generateSlug(el.textContent, slugCount);
      el.id = id;
      headings.push({ depth: depth, id: id, text: el.textContent.trim() });
    });

    if (!headings.length) {
      tocBody.innerHTML = '<p class="toc-empty">本文暂无目录</p>';
      return;
    }

    // 4. 构建嵌套 HTML
    tocBody.innerHTML = buildTocHtml(headings, useOrdered);

    // 5. 点击链接：平滑滚动到目标
    tocEl.addEventListener('click', function(e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      e.preventDefault();
      var targetId = decodeURIComponent(link.getAttribute('href').slice(1));
      var target = document.getElementById(targetId);
      if (target) {
        var headerH = 60;
        var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
      // 移动端点击后收起
      if (window.innerWidth <= 1024 && typeof closeDrawer === 'function') closeDrawer();
    });

    // 移动端点击链接后收起抽屉（closeDrawer 在下方定义，函数声明会提升）

    // 移动端抽屉：遮罩点击 + 关闭按钮 + 滚动锁定
    var tocMask = document.getElementById('toc-mask');
    var tocClose = document.getElementById('toc-close');
    function closeDrawer() {
      tocEl.classList.remove('show');
      if (tocMask) tocMask.classList.remove('show');
      document.body.style.overflow = '';
    }
    function openDrawer() {
      tocEl.classList.add('show');
      if (tocMask) tocMask.classList.add('show');
      // 仅在移动端锁定背景滚动
      if (window.innerWidth <= 768) document.body.style.overflow = 'hidden';
    }
    if (tocMask) tocMask.addEventListener('click', closeDrawer);
    if (tocClose) tocClose.addEventListener('click', closeDrawer);
    if (tocToggle) {
      tocToggle.addEventListener('click', function() {
        if (tocEl.classList.contains('show')) closeDrawer();
        else openDrawer();
      });
    }

    // 6. 滚动联动高亮
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(tocEl.querySelectorAll('a[href^="#"]'));
    var observeTargets = links.map(function(a) {
      return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
    }).filter(Boolean);
    if (!observeTargets.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          links.forEach(function(a) {
            a.classList.toggle('active', a.getAttribute('href') === '#' + id);
          });
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    observeTargets.forEach(function(h) { observer.observe(h); });

    // 工具：根据 heading 文本生成 id
    function generateSlug(text, counter) {
      var slug = String(text || '')
        .toLowerCase()
        .replace(/[\s\u3000]+/g, '-')
        .replace(/[^\w\u4e00-\u9fa5\-]+/g, '')
        .substring(0, 60) || 'heading';
      var finalSlug = slug;
      var i = 2;
      while (document.getElementById(finalSlug) || (counter[slug] > 0)) {
        finalSlug = slug + '-' + (i++);
      }
      counter[slug] = (counter[slug] || 0) + 1;
      return finalSlug;
    }

    // 工具：构建嵌套 ul/ol
    function buildTocHtml(items, ordered) {
      var tag = ordered ? 'ol' : 'ul';
      var html = '<' + tag + '>';
      var stack = [{ depth: 0, open: false }];

      items.forEach(function(h) {
        // 找父级
        while (stack.length > 1 && stack[stack.length - 1].depth >= h.depth) {
          html += '</' + tag + '>';
          stack.pop();
        }
        var parent = stack[stack.length - 1];
        if (h.depth > parent.depth) {
          html += '<' + tag + ' class="toc-child">';
          stack.push({ depth: h.depth });
        }
        html += '<li><a href="#' + h.id + '">' + escapeHtml(h.text) + '</a></li>';
      });
      while (stack.length > 1) {
        html += '</' + tag + '>';
        stack.pop();
      }
      html += '</' + tag + '>';
      return html;
    }

    function escapeHtml(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  }

  // ==========================================================================
  // 搜索
  // ==========================================================================
  function initSearch() {
    var input = document.getElementById('search-input');
    var box = document.getElementById('search-results');
    if (!input || !box) return;

    var data = null;
    function load() {
      if (data) return Promise.resolve(data);
      return fetch('/search.json')
        .then(function(r) { return r.json(); })
        .then(function(j) { data = (j && j.posts) || []; return data; })
        .catch(function() { data = []; return data; });
    }

    function render(results, keyword) {
      if (!keyword) return box.innerHTML = '<p class="empty-tip">请输入关键词开始搜索</p>';
      if (!results.length) return box.innerHTML = '<p class="empty-tip">未找到相关文章</p>';
      box.innerHTML = results.map(function(p) {
        return '<a class="result-item" href="' + p.url + '">' +
          '<h3 class="result-title">' + highlightKeyword(p.title, keyword) + '</h3>' +
          '<div class="result-meta">' +
            '<span>' + (p.date || '') + '</span>' +
            ((p.tags && p.tags.length) ? '<span>' + p.tags.map(function(t) { return '#' + t; }).join(' ') + '</span>' : '') +
          '</div>' +
          (p.content ? '<p class="result-content">' + escapeHtml(p.content) + '...</p>' : '') +
          '</a>';
      }).join('');
    }

    var onInput = debounce(function() {
      var kw = input.value.trim();
      if (!kw) { render([], ''); return; }
      load().then(function() {
        var lower = kw.toLowerCase();
        render(data.filter(function(p) { return p.title && p.title.toLowerCase().includes(lower); }), kw);
      });
    }, 250);
    input.addEventListener('input', onInput);
    load();
  }

  // ==========================================================================
  // 图片灯箱（点击放大）
  // ==========================================================================
  function initLightbox() {
    // 只在文章正文里启用
    var scope = document.querySelector('.post-content');
    if (!scope) return;

    var imgs = scope.querySelectorAll('img');
    if (!imgs.length) return;

    imgs.forEach(function(img) {
      // 跳过已被 a 标签包裹或带 data-no-lightbox 的图
      if (img.closest('a') || img.dataset.noLightbox !== undefined) return;
      img.classList.add('lightbox-able');
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function() {
        openLightbox(img.src, img.alt || '');
      });
    });

    function openLightbox(src, alt) {
      // 防止重复打开
      if (document.getElementById('img-lightbox')) return;
      var overlay = document.createElement('div');
      overlay.id = 'img-lightbox';
      overlay.className = 'img-lightbox';
      overlay.innerHTML =
        '<div class="img-lightbox-content">' +
          '<img src="' + src + '" alt="' + alt + '">' +
          (alt ? '<p class="img-lightbox-caption">' + alt + '</p>' : '') +
        '</div>' +
        '<button class="img-lightbox-close" aria-label="关闭">' +
          '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">' +
            '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
          '</svg>' +
        '</button>';
      document.body.appendChild(overlay);
      document.body.style.overflow = 'hidden';

      // 触发动画
      requestAnimationFrame(function() { overlay.classList.add('show'); });

      var close = function() {
        overlay.classList.remove('show');
        setTimeout(function() {
          overlay.remove();
          document.body.style.overflow = '';
        }, 200);
      };
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay || e.target.closest('.img-lightbox-close')) close();
      });
      document.addEventListener('keydown', function escHandler(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
      });
    }
  }

  // ==========================================================================
  // 统计信息
  // ==========================================================================
  function initStatistics() {
    var start = window.__SITE_START_DATE__ || '2024-01-01';
    var daysEls = document.querySelectorAll('#running-days, #widget-running-days');
    var lastEls = document.querySelectorAll('#last-updated');
    var totalEl = document.getElementById('post-total');

    // 已运行：详细格式（X 年 Y 个月 Z 天）
    var runningText = formatRunningTime(new Date(start));
    daysEls.forEach(function(el) { el.textContent = runningText; });

    // 最近更新：相对时间
    fetch('/search.json')
      .then(function(r) { return r.json(); })
      .then(function(j) {
        var posts = (j && j.posts) || [];
        if (totalEl) totalEl.textContent = posts.length;
        if (!lastEls.length) return;
        if (posts.length) {
          // 优先使用完整时间戳，没有时回退到 YYYY-MM-DD（按 0 点处理）
          var raw = posts[0].updated || posts[0].time || posts[0].date || '';
          var timeText = timeFromNow(raw) || '--';
          lastEls.forEach(function(el) {
            el.textContent = timeText;
            // 写入真实时间用于悬浮提示
            if (raw) el.setAttribute('title', raw);
          });
        } else {
          lastEls.forEach(function(el) { el.textContent = '--'; });
        }
      })
      .catch(function() {});
  }

  // ==========================================================================
  // 分享
  // ==========================================================================
  function initShare() {
    var wechat = document.querySelector('.share-wechat');
    var modal = document.getElementById('share-qrcode-modal');
    var qrBox = document.getElementById('share-qrcode-img');
    var close = document.getElementById('qrcode-close');
    var link = document.getElementById('share-link');

    function loadQR() {
      if (window.QRCode) return Promise.resolve(window.QRCode);
      return new Promise(function(res, rej) {
        var s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js';
        s.onload = function() { res(window.QRCode); };
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }

    if (wechat && modal) {
      wechat.addEventListener('click', function() {
        qrBox.innerHTML = '';
        loadQR().then(function(QR) {
          new QR(qrBox, { text: window.location.href, width: 200, height: 200 });
          modal.classList.add('show');
        });
      });
    }
    if (close) close.addEventListener('click', function() { modal.classList.remove('show'); });
    if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('show'); });

    if (link) {
      link.addEventListener('click', function() {
        var url = link.dataset.url || window.location.href;
        var ok = function() {
          var orig = link.innerHTML;
          link.innerHTML = '已复制 ✓';
          setTimeout(function() { link.innerHTML = orig; }, 2000);
        };
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(url).then(ok);
        } else {
          var ta = document.createElement('textarea');
          ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy') && ok(); } catch (e) {}
          document.body.removeChild(ta);
        }
      });
    }
  }

  // ==========================================================================
  // 打赏
  // ==========================================================================
  function initReward() {
    var btn = document.getElementById('reward-toggle');
    var modal = document.getElementById('reward-modal');
    var close = document.getElementById('reward-close');
    if (!btn || !modal) return;
    btn.addEventListener('click', function() { modal.classList.add('show'); });
    if (close) close.addEventListener('click', function() { modal.classList.remove('show'); });
    modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('show'); });
  }

  // ==========================================================================
  // 鼠标点击特效
  // ==========================================================================
  function initClickEffect() {
    var texts = window.__CLICK_EFFECT_TEXTS__ || [];
    if (!texts.length) return;
    var last = 0;
    document.addEventListener('click', function(e) {
      var now = Date.now();
      if (now - last < 80) return;
      last = now;
      var span = document.createElement('span');
      span.className = 'click-effect';
      span.textContent = texts[Math.floor(Math.random() * texts.length)];
      span.style.left = e.clientX + 'px';
      span.style.top = e.clientY + 'px';
      document.body.appendChild(span);
      setTimeout(function() { span.remove(); }, 1000);
    });
  }

  // ==========================================================================
  // 主题切换按钮
  // ==========================================================================
  function initThemeToggle() {
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
    // 监听系统主题变化
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', function() {
        var stored = storageGet(THEME_KEY);
        if (!stored || stored === 'auto') applyTheme('auto');
      });
    }
  }

  // ==========================================================================
  // 启动
  // ==========================================================================
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function() {
    initThemeToggle();
    initMobileMenu();
    initBackToTop();
    initProgressBar();
    initCodeBlocks();
    initToc();
    initSearch();
    initLightbox();
    initStatistics();
    initShare();
    initReward();
    initClickEffect();
  });

  // 暴露调试接口
  window.FangTheme = { apply: applyTheme, toggle: toggleTheme };
})(window);
