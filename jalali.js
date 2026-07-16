/* ===================================================================
   jalali.js — ابزار تبدیل تاریخ میلادی/شمسی + ویجت انتخاب تاریخ فارسی
   برای پروژه نیک‌پلاس
   =================================================================== */
(function (window) {
  // ---------------- الگوریتم تبدیل (jalaali) ----------------
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }

  var breaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

  function jalCal(jy) {
    var bl = breaks.length, gy = jy + 621, leapJ = -14, jp = breaks[0], jm, jump, leap, leapG, march, n, i;
    for (i = 1; i < bl; i += 1) {
      jm = breaks[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }

  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
    return d;
  }

  function d2g(jdn) {
    var j, i, gd, gm, gy;
    j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    i = div(mod(j, 1461), 4) * 5 + 308;
    gd = div(mod(i, 153), 5) + 1;
    gm = mod(div(i, 153), 12) + 1;
    gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }

  function j2d(jy, jm, jd) {
    var r = jalCal(jy);
    return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
  }

  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy), jdn1f = g2d(gy, 3, r.march), jd, jm, k;
    k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
      else { k -= 186; }
    } else { jy -= 1; k += 179; if (r.leap === 1) k += 1; }
    jm = 7 + div(k, 30); jd = mod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }

  function toJalaali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }
  function toGregorian(jy, jm, jd) { return d2g(j2d(jy, jm, jd)); }
  function isLeapJalaaliYear(jy) { return jalCal(jy).leap === 0; }
  function jalaaliMonthLength(jy, jm) {
    if (jm <= 6) return 31;
    if (jm <= 11) return 30;
    return isLeapJalaaliYear(jy) ? 30 : 29;
  }

  // ---------------- نام‌ها و اعداد فارسی ----------------
  var MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  // اندیس بر اساس Date.getDay() جاوااسکریپت: 0=یکشنبه ... 6=شنبه
  var WEEKDAYS_FULL = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
  var FA_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  function toFaDigits(val) {
    return String(val).replace(/[0-9]/g, function (d) { return FA_DIGITS[d]; });
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function isoToParts(iso) {
    var p = iso.split('-').map(Number);
    return { gy: p[0], gm: p[1], gd: p[2] };
  }
  function partsToIso(gy, gm, gd) { return gy + '-' + pad2(gm) + '-' + pad2(gd); }

  function isoToJalali(iso) {
    var g = isoToParts(iso);
    return toJalaali(g.gy, g.gm, g.gd);
  }
  function jalaliToIso(jy, jm, jd) {
    var g = toGregorian(jy, jm, jd);
    return partsToIso(g.gy, g.gm, g.gd);
  }
  function weekdayFaFromIso(iso) {
    var d = new Date(iso + 'T00:00:00');
    return WEEKDAYS_FULL[d.getDay()];
  }
  function formatJalaliDisplay(iso, withWeekday) {
    if (!iso) return '';
    var j = isoToJalali(iso);
    var str = toFaDigits(j.jd) + ' ' + MONTHS[j.jm - 1] + ' ' + toFaDigits(j.jy);
    if (withWeekday) str = weekdayFaFromIso(iso) + '، ' + str;
    return str;
  }

  // ---------------- ویجت انتخاب تاریخ ----------------
  function attachPicker(hiddenInput, mountEl, opts) {
    opts = opts || {};
    var minIso = opts.minDateISO || null;
    var today = new Date();
    var todayIso = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
    var presetIso = hiddenInput.value || null;
    var baseIso = presetIso || minIso || todayIso;
    var viewJ = isoToJalali(baseIso);
    var viewYear = viewJ.jy, viewMonth = viewJ.jm;

    mountEl.style.position = 'relative';
    mountEl.innerHTML =
      '<button type="button" class="jalali-picker-btn w-full px-4 py-3 rounded-xl border border-ink/10 focus:border-forest focus:ring-2 focus:ring-forest/20 outline-none transition-all text-sm text-right bg-white flex items-center justify-between gap-2">' +
        '<span class="jalali-picker-label ' + (presetIso ? 'text-ink/80 font-bold' : 'text-ink/40') + '">' + (presetIso ? formatJalaliDisplay(presetIso, true) : 'انتخاب تاریخ') + '</span>' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>' +
      '</button>' +
      '<div class="jalali-picker-popup hidden absolute z-50 mt-2 bg-white border border-ink/10 rounded-2xl shadow-xl p-4 w-72 right-0"></div>';

    var btn = mountEl.querySelector('.jalali-picker-btn');
    var label = mountEl.querySelector('.jalali-picker-label');
    var popup = mountEl.querySelector('.jalali-picker-popup');

    function renderCalendar() {
      var monthLen = jalaaliMonthLength(viewYear, viewMonth);
      var firstIso = jalaliToIso(viewYear, viewMonth, 1);
      var firstWeekday = new Date(firstIso + 'T00:00:00').getDay(); // 0=یکشنبه..6=شنبه
      var offset = (firstWeekday + 1) % 7; // تبدیل به شروع هفته از شنبه

      var html = '<div class="flex items-center justify-between mb-3">' +
        '<button type="button" data-nav="next" class="p-1.5 rounded-lg hover:bg-mist text-ink/60">&#9668;</button>' +
        '<span class="font-bold text-sm text-forestDark">' + MONTHS[viewMonth - 1] + ' ' + toFaDigits(viewYear) + '</span>' +
        '<button type="button" data-nav="prev" class="p-1.5 rounded-lg hover:bg-mist text-ink/60">&#9658;</button>' +
      '</div>';

      html += '<div class="grid grid-cols-7 gap-1 mb-1 text-center">';
      ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].forEach(function (w) {
        html += '<span class="text-xs text-ink/35 font-bold">' + w + '</span>';
      });
      html += '</div>';

      html += '<div class="grid grid-cols-7 gap-1 text-center">';
      for (var i = 0; i < offset; i++) html += '<span></span>';
      for (var d = 1; d <= monthLen; d++) {
        var iso = jalaliToIso(viewYear, viewMonth, d);
        var disabled = minIso && iso < minIso;
        var isSelected = iso === hiddenInput.value;
        html += '<button type="button" data-iso="' + iso + '" ' + (disabled ? 'disabled' : '') +
          ' class="jalali-day-btn text-xs py-2 rounded-lg ' +
          (disabled ? 'text-ink/20 cursor-not-allowed' : (isSelected ? 'bg-forest text-white' : 'hover:bg-mist text-ink/70 cursor-pointer')) +
          '">' + toFaDigits(d) + '</button>';
      }
      html += '</div>';

      popup.innerHTML = html;

      popup.querySelector('[data-nav="prev"]').addEventListener('click', function () {
        viewMonth += 1;
        if (viewMonth > 12) { viewMonth = 1; viewYear += 1; }
        renderCalendar();
      });
      popup.querySelector('[data-nav="next"]').addEventListener('click', function () {
        viewMonth -= 1;
        if (viewMonth < 1) { viewMonth = 12; viewYear -= 1; }
        renderCalendar();
      });
      popup.querySelectorAll('.jalali-day-btn:not([disabled])').forEach(function (dayBtn) {
        dayBtn.addEventListener('click', function () {
          var iso = dayBtn.dataset.iso;
          hiddenInput.value = iso;
          label.textContent = formatJalaliDisplay(iso, true);
          label.classList.remove('text-ink/40');
          label.classList.add('text-ink/80', 'font-bold');
          popup.classList.add('hidden');
          hiddenInput.dispatchEvent(new Event('change'));
        });
      });
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var willOpen = popup.classList.contains('hidden');
      document.querySelectorAll('.jalali-picker-popup').forEach(function (p) { p.classList.add('hidden'); });
      if (willOpen) {
        popup.classList.remove('hidden');
        renderCalendar();
      }
    });
    document.addEventListener('click', function (e) {
      if (!mountEl.contains(e.target)) popup.classList.add('hidden');
    });
  }

  window.JalaliUtil = {
    toJalaali: toJalaali,
    toGregorian: toGregorian,
    isoToJalali: isoToJalali,
    jalaliToIso: jalaliToIso,
    weekdayFaFromIso: weekdayFaFromIso,
    formatJalaliDisplay: formatJalaliDisplay,
    toFaDigits: toFaDigits,
    attachPicker: attachPicker,
    WEEKDAYS_FULL: WEEKDAYS_FULL,
    MONTHS: MONTHS
  };
})(window);
