document.addEventListener("DOMContentLoaded", () => {
  const messageInput   = document.getElementById("messageInput");
  const charCount      = document.getElementById("charCount");
  const scanBtn        = document.getElementById("scanBtn");
  const scanBtnLabel   = document.getElementById("scanBtnLabel");
  const clearBtn       = document.getElementById("clearBtn");
  const scanAnotherBtn = document.getElementById("scanAnotherBtn");
  const scanSweep      = document.getElementById("scanSweep");

  const resultEmpty    = document.getElementById("resultEmpty");
  const resultContent  = document.getElementById("resultContent");
  const resultError    = document.getElementById("resultError");

  const gaugeFill   = document.getElementById("gaugeFill");
  const gaugeValue  = document.getElementById("gaugeValue");
  const verdictBadge = document.getElementById("verdictBadge");
  const verdictDesc  = document.getElementById("verdictDesc");

  const GAUGE_CIRCUMFERENCE = 364.4;

  // ---- character counter -------------------------------------------------
  messageInput.addEventListener("input", () => {
    charCount.textContent = messageInput.value.length;
  });

  // ---- clear --------------------------------------------------------------
  clearBtn.addEventListener("click", () => {
    messageInput.value = "";
    charCount.textContent = "0";
    messageInput.focus();
    resetResult();
  });

  scanAnotherBtn.addEventListener("click", () => {
    messageInput.value = "";
    charCount.textContent = "0";
    messageInput.focus();
    resetResult();
  });

  function resetResult() {
    resultContent.style.display = "none";
    resultError.style.display = "none";
    resultEmpty.style.display = "flex";
    gaugeFill.style.stroke = "var(--accent)";
    gaugeFill.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;
  }

  // ---- scan ---------------------------------------------------------------
  scanBtn.addEventListener("click", async () => {
    const message = messageInput.value.trim();

    if (!message) {
      messageInput.focus();
      messageInput.style.boxShadow = "inset 0 0 0 1px var(--danger)";
      setTimeout(() => { messageInput.style.boxShadow = ""; }, 900);
      return;
    }

    startScanningUI();

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      showResult(data);
    } catch (err) {
      showError(err.message || "Could not reach the scanner. Try again.");
    } finally {
      stopScanningUI();
    }
  });

  function startScanningUI() {
    scanBtn.disabled = true;
    scanBtn.classList.add("scanning");
    scanBtnLabel.textContent = "Scanning...";
    scanSweep.classList.add("active");
  }

  function stopScanningUI() {
    scanBtn.disabled = false;
    scanBtn.classList.remove("scanning");
    scanBtnLabel.textContent = "Scan message";
    scanSweep.classList.remove("active");
  }

  function showResult(data) {
    resultEmpty.style.display = "none";
    resultError.style.display = "none";
    resultContent.style.display = "flex";

    const isSpam = data.prediction === "spam";
    const confidence = Math.max(0, Math.min(100, data.confidence));

    // Gauge
    const offset = GAUGE_CIRCUMFERENCE - (confidence / 100) * GAUGE_CIRCUMFERENCE;
    gaugeFill.style.stroke = isSpam ? "var(--danger)" : "var(--accent)";
    // Force reflow so the transition re-triggers every scan
    gaugeFill.style.strokeDashoffset = GAUGE_CIRCUMFERENCE;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        gaugeFill.style.strokeDashoffset = offset;
      });
    });

    animateCount(gaugeValue, confidence, "%");

    // Verdict
    verdictBadge.textContent = isSpam ? "SPAM DETECTED" : "SAFE";
    verdictBadge.classList.toggle("spam", isSpam);
    verdictDesc.textContent = isSpam
      ? "This message shows strong patterns associated with spam or phishing."
      : "This message looks like normal, everyday communication.";
  }

  function showError(msg) {
    resultEmpty.style.display = "none";
    resultContent.style.display = "none";
    resultError.style.display = "block";
    resultError.textContent = msg;
  }

  function animateCount(el, target, suffix = "") {
    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(eased * target);
      el.textContent = `${value}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // allow Cmd/Ctrl+Enter to scan
  messageInput.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      scanBtn.click();
    }
  });

  // ---- stat counters (animate once visible) --------------------------------
  const statEls = document.querySelectorAll(".stat-value[data-count]");
  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute("data-count"));
        const suffix = el.getAttribute("data-suffix") || "";
        animateCount(el, target, suffix);
        statObserver.unobserve(el);
      }
    });
  }, { threshold: 0.4 });
  statEls.forEach((el) => statObserver.observe(el));

  // ---- pipeline step reveal on scroll ---------------------------------------
  const steps = document.querySelectorAll(".pipeline-step");
  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("in-view"), i * 120);
        stepObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  steps.forEach((el) => stepObserver.observe(el));
});
