(function () {
  var INBOX = "renjiniraju14@gmail.com";
  var FORMSUBMIT_KEY = "abf29d90cce78e444f5c13ee3bb27ae4";
  var FORMSUBMIT_AJAX = "https://formsubmit.co/ajax/" + FORMSUBMIT_KEY;
  var FORMSUBMIT_POST = "https://formsubmit.co/" + FORMSUBMIT_KEY;

  var sections = document.querySelectorAll("section[id]");
  var navLinks = document.querySelectorAll(".nav-link");
  var navToggle = document.getElementById("navToggle");
  var sidebar = document.getElementById("siteSidebar");
  var themeToggle = document.getElementById("themeToggle");
  var themeLabel = themeToggle && themeToggle.querySelector(".theme-toggle__label");
  var toTop = document.getElementById("toTop");
  var contactForm = document.getElementById("contactForm");

  function postToInboxViaForm(fields) {
    return new Promise(function (resolve, reject) {
      try {
        var frameId = "formsubmit_silent_frame";
        var frame = document.getElementById(frameId);
        if (!frame) {
          frame = document.createElement("iframe");
          frame.id = frameId;
          frame.name = frameId;
          frame.style.display = "none";
          frame.setAttribute("aria-hidden", "true");
          document.body.appendChild(frame);
        }

        var form = document.createElement("form");
        form.method = "POST";
        form.action = FORMSUBMIT_POST;
        form.target = frameId;
        form.style.display = "none";

        Object.keys(fields).forEach(function (key) {
          var input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = fields[key];
          form.appendChild(input);
        });

        var captcha = document.createElement("input");
        captcha.type = "hidden";
        captcha.name = "_captcha";
        captcha.value = "false";
        form.appendChild(captcha);

        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        resolve({ success: true, via: "iframe-fallback" });
      } catch (err) {
        reject(err);
      }
    });
  }

  function openNativeContactFallback(fields) {
    var form = document.createElement("form");
    form.method = "POST";
    form.action = FORMSUBMIT_POST;
    form.target = "_blank";
    form.style.display = "none";

    Object.keys(fields).forEach(function (key) {
      var input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = fields[key];
      form.appendChild(input);
    });

    var captcha = document.createElement("input");
    captcha.type = "hidden";
    captcha.name = "_captcha";
    captcha.value = "false";
    form.appendChild(captcha);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  function sendToInbox(fields) {
    var formData = new FormData();
    Object.keys(fields).forEach(function (key) {
      formData.append(key, fields[key]);
    });
    formData.append("_captcha", "false");

    return fetch(FORMSUBMIT_AJAX, {
      method: "POST",
      body: formData,
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch (err) {
          data = { raw: text };
        }
        if (!res.ok || !formSubmitLooksOk(data)) {
          throw new Error((data && data.message) || "Request failed");
        }
        return data;
      });
    }).catch(function () {
      // Fallback for hosts/environments where AJAX/CORS can fail.
      return fetch(FORMSUBMIT_POST, {
        method: "POST",
        mode: "no-cors",
        body: formData,
      }).then(function () {
        return { success: true, via: "no-cors-fallback" };
      }).catch(function () {
        // Last fallback: silent native form POST in a hidden iframe.
        return postToInboxViaForm(fields);
      });
    });
  }

  function formSubmitLooksOk(data) {
    if (!data) return false;
    if (data.success === true || data.success === "true") return true;
    if (data.ok === true) return true;
    if (typeof data.success === "string" && /thank you|success/i.test(data.success)) return true;
    return false;
  }

  function safeSessionGet(key) {
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function safeSessionSet(key, val) {
    try {
      sessionStorage.setItem(key, val);
    } catch (e) {}
  }

  function notifyCvDownloadClick() {
    if (safeSessionGet("portfolio_cv_notify")) return;
    sendToInbox({
      _subject: "Portfolio: Download CV clicked",
      name: "Portfolio visitor",
      email: INBOX,
      message:
        'Someone clicked "Download CV" on your portfolio (sidebar).\nThis is an automated notice - their email was not collected on this step.\n\nPage: ' +
        location.href +
        "\nTime (UTC): " +
        new Date().toISOString(),
    })
      .then(function (data) {
        if (formSubmitLooksOk(data)) {
          safeSessionSet("portfolio_cv_notify", "1");
        }
      })
      .catch(function () {});
  }

  function setMenuOpen(open) {
    document.body.classList.toggle("menu-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
    if (sidebar) {
      sidebar.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }

  function toggleMenu() {
    setMenuOpen(!document.body.classList.contains("menu-open"));
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function setActiveById(id) {
    navLinks.forEach(function (link) {
      var sec = link.getAttribute("data-section");
      link.classList.toggle("active", sec === id);
    });
  }

  function setActiveNav() {
    var y = window.scrollY + Math.min(180, window.innerHeight * 0.25);
    var current = "home";
    for (var i = 0; i < sections.length; i++) {
      var sec = sections[i];
      if (sec.id && sec.offsetTop <= y) {
        current = sec.id;
      }
    }
    setActiveById(current);
  }

  try {
    window.addEventListener("scroll", setActiveNav, { passive: true });
    window.addEventListener("resize", setActiveNav, { passive: true });
  } catch (e) {
    window.addEventListener("scroll", setActiveNav);
    window.addEventListener("resize", setActiveNav);
  }
  setActiveNav();

  if (sidebar) {
    sidebar.addEventListener("click", function () {
      closeMenu();
    });
  }

  if (navToggle) {
    navToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      toggleMenu();
    });
  }

  try {
    var stored = localStorage.getItem("portfolio-theme");
    if (stored === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    }
  } catch (e) {}
  function syncThemeLabel() {
    if (!themeLabel) return;
    var isLight = document.documentElement.getAttribute("data-theme") === "light";
    themeLabel.textContent = isLight ? "Dark Mode" : "Light Mode";
  }
  syncThemeLabel();

  if (themeToggle) {
    themeToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var isLight = document.documentElement.getAttribute("data-theme") === "light";
      try {
        if (isLight) {
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem("portfolio-theme", "dark");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
          localStorage.setItem("portfolio-theme", "light");
        }
      } catch (e) {
        if (isLight) {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", "light");
        }
      }
      syncThemeLabel();
    });
  }

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  var cvDialog = document.getElementById("cvRequestDialog");
  var cvOpenBtn = document.getElementById("cvRequestOpen");
  var cvMailto = document.getElementById("cvMailtoRequest");
  var cvCloseBtn = document.getElementById("cvDialogCloseBtn");
  var cvCloseX = document.getElementById("cvDialogCloseX");

  function setCvMailHref() {
    if (!cvMailto) return;
    var sub = encodeURIComponent("CV download request — portfolio");
    var body = encodeURIComponent(
      "Hello Renjini,\n\nI would like to request your CV from your portfolio.\n\nMy name: \nMy email: \n\nThank you."
    );
    cvMailto.href = "mailto:renjiniraju14@gmail.com?subject=" + sub + "&body=" + body;
  }
  setCvMailHref();

  function openCvDialog() {
    closeMenu();
    try {
      notifyCvDownloadClick();
    } catch (e) {}
    if (cvDialog && typeof cvDialog.showModal === "function") {
      cvDialog.showModal();
    } else if (cvMailto) {
      window.location.href = cvMailto.href;
    }
  }

  function closeCvDialog() {
    if (cvDialog && cvDialog.open) {
      cvDialog.close();
    }
  }

  if (cvOpenBtn) {
    cvOpenBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      openCvDialog();
    });
  }

  if (cvCloseBtn) {
    cvCloseBtn.addEventListener("click", closeCvDialog);
  }
  if (cvCloseX) {
    cvCloseX.addEventListener("click", closeCvDialog);
  }

  if (cvDialog) {
    cvDialog.addEventListener("click", function (e) {
      if (e.target === cvDialog) {
        closeCvDialog();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (cvDialog && cvDialog.open) {
      closeCvDialog();
      return;
    }
    if (document.body.classList.contains("menu-open")) {
      closeMenu();
    }
  });

  if (contactForm) {
    var formStatus = document.getElementById("formStatus");
    var submitBtn = document.getElementById("contactSubmitBtn");

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (formStatus) {
        formStatus.textContent = "";
        formStatus.className = "contact__status";
      }

      var honeypot = contactForm.querySelector("[name=_gotcha]");
      if (honeypot && honeypot.value) {
        return;
      }

      var name = document.getElementById("cname").value.trim();
      var email = document.getElementById("cemail").value.trim();
      var msg = document.getElementById("cmsg").value.trim();

      if (!name || !email || !msg) {
        if (formStatus) {
          formStatus.textContent = "Please fill in name, email, and message.";
          formStatus.classList.add("contact__status--err");
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (formStatus) {
        formStatus.textContent = "Sending…";
      }

      sendToInbox({
        name: name,
        email: email,
        message: msg,
        _template: "table",
      })
        .then(function (data) {
          if (formSubmitLooksOk(data)) {
            if (formStatus) {
              formStatus.textContent = "Thanks - your message was sent. I will get back to you soon.";
              formStatus.classList.add("contact__status--ok");
            }
            contactForm.reset();
          } else {
            throw new Error("Unexpected response");
          }
        })
        .catch(function () {
          try {
            openNativeContactFallback({
              name: name,
              email: email,
              message: msg,
              _template: "table",
            });
            if (formStatus) {
              formStatus.textContent =
                "Opening browser fallback submit. If blocked, please email me at " + INBOX + ".";
              formStatus.classList.add("contact__status--ok");
            }
          } catch (err) {
            if (formStatus) {
              formStatus.textContent =
                "Could not send automatically. Please email me at " + INBOX + " or try again in a moment.";
              formStatus.classList.add("contact__status--err");
            }
          }
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
          }
        });
    });
  }
})();
