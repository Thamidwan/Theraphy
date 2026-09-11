/* OA Outpatient Therapy Services — Phase 1 site behaviour
   Restrained interactions only: header state, mobile nav, scroll-reveal,
   count-up on the 5 / 1 / 0 stat block, WhatsApp click-to-chat wiring,
   Resources tabs, and the Contact enquiry hand-off. */

document.documentElement.classList.add("js");

document.addEventListener("DOMContentLoaded", function () {
  var WA_NUMBER = "27754070763";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- WhatsApp click-to-chat links (context-specific pre-filled message) ---- */
  var waMsg = document.body.getAttribute("data-wa-msg") ||
    "Hi, I'd like to know more about OA's programme.";
  var waHref = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(waMsg);
  document.querySelectorAll(".js-wa").forEach(function (a) { a.setAttribute("href", waHref); });

  /* ---- Sticky header shadow on scroll ---- */
  var header = document.querySelector(".site-header");
  var onScroll = function () {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile navigation ---- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("primary-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll reveal on section entry (~300ms fade / slide) ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Animated count-up on the signature stat block ---- */
  var nums = document.querySelectorAll("[data-count]");
  var runCount = function (el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion || target === 0) { el.textContent = String(target); return; }
    var dur = 900, start = null;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      el.textContent = String(Math.round(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window && nums.length) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); io2.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    nums.forEach(function (el) { io2.observe(el); });
  } else {
    nums.forEach(runCount);
  }

  /* ---- WhatsApp floating button: gentle pulse on first load only ---- */
  var fab = document.querySelector(".wa-fab");
  if (fab && !reduceMotion) {
    fab.classList.add("pulse");
    setTimeout(function () { fab.classList.remove("pulse"); }, 5200);
  }

  /* ---- Resources: For Patients / For Professionals toggle ---- */
  var tablist = document.querySelector(".tabs");
  if (tablist) {
    var tabs = tablist.querySelectorAll(".tab");
    var selectTab = function (tab) {
      tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
      tab.setAttribute("aria-selected", "true");
      var panelId = tab.getAttribute("aria-controls");
      document.querySelectorAll(".res-panel").forEach(function (p) {
        p.hidden = (p.id !== panelId);
      });
    };
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () { selectTab(tab); });
    });
    if (location.hash === "#professionals") {
      var proTab = document.getElementById("tab-professionals");
      if (proTab) selectTab(proTab);
    }
  }

  /* ---- One-pager download placeholder (asset pending from OA) ---- */
  document.querySelectorAll(".js-onepager").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      var note = document.getElementById("onepager-note");
      if (note) { note.hidden = false; }
    });
  });

  /* ---- Contact enquiry form: audience routing + WhatsApp/email hand-off ---- */
  var form = document.getElementById("contact-form");
  if (form) {
    var audience = form.querySelector("#audience");
    var practiceRow = form.querySelector("#practice-row");
    var practiceInput = practiceRow ? practiceRow.querySelector("input") : null;

    var syncPractice = function () {
      var pro = audience.value === "Referring Doctor or Hospital" ||
                audience.value === "Allied Health Professional";
      if (practiceRow) practiceRow.hidden = !pro;
      if (practiceInput) practiceInput.required = pro;
    };
    if (audience && practiceRow) {
      audience.addEventListener("change", syncPractice);
      syncPractice();
    }

    var buildMessage = function () {
      var v = function (id) {
        var el = form.querySelector("#" + id);
        return el ? el.value.trim() : "";
      };
      var lines = [
        "New enquiry via the OA website",
        "— I am a: " + v("audience"),
        "— Name: " + v("name"),
        "— Phone: " + v("phone"),
        "— Email: " + v("email")
      ];
      if (practiceRow && !practiceRow.hidden) {
        lines.push("— Practice / hospital: " + v("practice"));
      }
      lines.push("— Message: " + v("message"));
      return lines.join("\n");
    };

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var msg = buildMessage();
      var wa = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
      var mail = "mailto:info@oapractice.co.za?subject=" +
        encodeURIComponent("Website enquiry") + "&body=" + encodeURIComponent(msg);

      var again = document.getElementById("confirm-wa");
      var email = document.getElementById("confirm-mail");
      var nameOut = document.getElementById("confirm-name");
      if (again) again.setAttribute("href", wa);
      if (email) email.setAttribute("href", mail);
      if (nameOut) nameOut.textContent = (form.querySelector("#name").value.trim() || "there");

      window.open(wa, "_blank", "noopener");

      form.hidden = true;
      var confirm = document.getElementById("form-confirm");
      if (confirm) {
        confirm.hidden = false;
        confirm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
  }
});
