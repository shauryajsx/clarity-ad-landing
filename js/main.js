/**
 * Recobro Vigile® Ad Landing Page Scripts
 * Interactive features: Live ECG canvas monitor, conversion modal,
 * ad tracking hooks (Google Ads gtag & Meta Pixel fbq), sticky CTA bar.
 */

document.addEventListener('DOMContentLoaded', () => {
  initLiveEcgCanvas();
  initConversionTracking();
  initModalHandling();
  initStickyBar();
  initSmoothScroll();
  initMobileMenu();
  initSpecsTabs();
  initEnvironmentTabs();
  initPosterModal();
  initVitalCardsInteractivity();
});

/* ==========================================================================
   1. REAL-TIME ECG OSCILLOSCOPE SIMULATOR
   ========================================================================== */
function initLiveEcgCanvas() {
  const canvas = document.getElementById('heroEcgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.parentElement.clientWidth);
  let height = (canvas.height = canvas.parentElement.clientHeight);

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.clientWidth;
    height = canvas.height = canvas.parentElement.clientHeight;
  });

  // Generate synthetic Lead II ECG pattern
  // Values normalized between -1 and 1
  const ecgWaveformPattern = [
    0, 0, 0.05, 0.12, 0.18, 0.12, 0.04, 0, 0, // P wave
    -0.02, 0, // PR segment
    -0.15, 0.85, -0.35, 0, // QRS complex (sharp deflection)
    0, 0.03, 0.08, 0.18, 0.24, 0.22, 0.14, 0.05, 0, // T wave
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 // Isoelectric line
  ];

  let x = 0;
  let patternIndex = 0;
  const speed = 2.2;
  const midY = height * 0.55;
  const amplitude = height * 0.38;

  // Track points to draw continuous line
  const points = [];
  const maxPoints = Math.ceil(width / speed);

  function drawGrid() {
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 0.5;
    const gridSize = 14;
    for (let gx = 0; gx < width; gx += gridSize) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    for (let gy = 0; gy < height; gy += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(width, gy);
      ctx.stroke();
    }
  }

  function animate() {
    // Semi-transparent clear to produce slight phosphor sweep effect
    ctx.fillStyle = '#040911';
    ctx.fillRect(0, 0, width, height);
    drawGrid();

    // Get current sample
    const sample = ecgWaveformPattern[patternIndex % ecgWaveformPattern.length];
    const y = midY - sample * amplitude;

    points.push({ x, y });
    if (points.length > maxPoints) {
      points.shift();
    }

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < points.length; i++) {
      const pt = points[i];
      // Offset x smoothly
      const currentX = (i * speed) % width;
      if (i === 0) {
        ctx.moveTo(currentX, pt.y);
      } else {
        ctx.lineTo(currentX, pt.y);
      }
    }
    ctx.stroke();

    // Draw glowing sweep head dot
    const headX = ((points.length - 1) * speed) % width;
    ctx.beginPath();
    ctx.arc(headX, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0; // reset

    patternIndex++;
    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);

  // Subtle physiological vital variations
  setInterval(() => {
    const hrEl = document.getElementById('liveHrVal');
    const spo2El = document.getElementById('liveSpo2Val');
    if (hrEl) {
      const hr = 79 + Math.floor(Math.random() * 3);
      hrEl.textContent = hr;
    }
    if (spo2El) {
      const spo2 = 98 + (Math.random() > 0.7 ? 1 : 0);
      spo2El.textContent = Math.min(100, spo2);
    }
  }, 3500);
}

/* ==========================================================================
   2. GOOGLE ADS & META PIXEL CONVERSION HOOKS
   ========================================================================== */
function trackConversionEvent(eventName, eventData = {}) {
  console.log(`[Ad Tracking Triggered]: ${eventName}`, eventData);

  // Google Analytics 4 / Google Ads gtag
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventData);
  }

  // Meta Pixel fbq
  if (typeof window.fbq === 'function') {
    if (eventName === 'generate_lead') {
      window.fbq('track', 'Lead', eventData);
    } else {
      window.fbq('trackCustom', eventName, eventData);
    }
  }
}

function initConversionTracking() {
  // Hero Inline Lead Capture
  const heroForm = document.getElementById('heroLeadForm');
  const heroEmailInput = document.getElementById('heroEmailInput');
  const heroFeedback = document.getElementById('heroFeedback');

  if (heroForm) {
    heroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = heroEmailInput ? heroEmailInput.value.trim() : '';
      if (!email) return;

      trackConversionEvent('generate_lead', {
        source: 'hero_inline_input',
        email: email,
        value: 100,
        currency: 'USD'
      });

      if (heroFeedback) {
        heroFeedback.style.display = 'block';
        heroFeedback.textContent = '✓ Request received! Opening institutional quote specs...';
      }

      // Pre-fill email in main modal and open it
      setTimeout(() => {
        const modalEmail = document.getElementById('modalEmail');
        if (modalEmail) modalEmail.value = email;
        openModal();
        if (heroFeedback) heroFeedback.style.display = 'none';
        if (heroEmailInput) heroEmailInput.value = '';
      }, 700);
    });
  }

  // Modal Full Lead Capture
  const quoteForm = document.getElementById('institutionalQuoteForm');
  if (quoteForm) {
    quoteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('modalName')?.value || '';
      const org = document.getElementById('modalHospital')?.value || '';
      const email = document.getElementById('modalEmail')?.value || '';
      const phone = document.getElementById('modalPhone')?.value || '';
      const units = document.getElementById('modalUnits')?.value || '1-5';

      trackConversionEvent('generate_lead', {
        source: 'full_quote_modal',
        name,
        organization: org,
        email,
        phone,
        units,
        value: 500,
        currency: 'USD'
      });

      const modalBody = document.querySelector('.modal-card');
      if (modalBody) {
        modalBody.innerHTML = `
          <div style="text-align: center; padding: 24px 0;">
            <div style="width: 58px; height: 58px; border-radius: 50%; background: #ecfdf5; color: #10b981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 18px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style="font-size: 22px; font-weight: 800; color: #0b1523; margin-bottom: 8px;">Demo & Quote Request Confirmed!</h3>
            <p style="font-size: 14.5px; color: #4a5568; line-height: 1.6; margin-bottom: 24px;">
              Thank you, <strong>${name}</strong>. A Clarity Medical clinical specialist has been assigned to prepare the institutional pricing for <strong>${org}</strong>.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: left;">
              <div style="font-size: 12px; font-weight: 700; color: #10848f; text-transform: uppercase; margin-bottom: 4px;">Immediate Access</div>
              <div style="font-size: 14px; font-weight: 600; color: #0b1523;">Recobro Vigile® Full Technical Specifications & CE 0123 Dossier</div>
            </div>
            <button class="btn btn-teal btn-lg" onclick="downloadSpecBrochure(); closeModal();" style="width: 100%;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Technical PDF Brochure
            </button>
          </div>
        `;
      }
    });
  }
}

/* ==========================================================================
   3. MODAL CONTROLS
   ========================================================================== */
function openModal() {
  const modal = document.getElementById('leadQuoteModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  const modal = document.getElementById('leadQuoteModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initModalHandling() {
  // Wire all quote and demo buttons
  document.querySelectorAll('.open-quote-modal').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  const closeBtn = document.getElementById('modalCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const overlay = document.getElementById('leadQuoteModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openPosterModal() {
  const modal = document.getElementById('posterInfographicModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    if (typeof trackConversionEvent === 'function') {
      trackConversionEvent('view_poster_infographic', { source: 'visibility_section' });
    }
  }
}

function closePosterModal() {
  const modal = document.getElementById('posterInfographicModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function initPosterModal() {
  const openBtn = document.getElementById('btnOpenPosterModal');
  if (openBtn) openBtn.addEventListener('click', openPosterModal);

  const closeBtn = document.getElementById('posterModalCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closePosterModal);

  const overlay = document.getElementById('posterInfographicModal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePosterModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePosterModal();
  });
}

function initVitalCardsInteractivity() {
  const cards = document.querySelectorAll('.vital-callout-card');
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      const vitalKey = card.getAttribute('data-vital');
      if (typeof trackConversionEvent === 'function') {
        trackConversionEvent('inspect_vital_parameter', { vital: vitalKey });
      }
    });
  });
}

/* ==========================================================================
   4. STICKY CONVERSION BAR ON SCROLL
   ========================================================================== */
function initStickyBar() {
  const stickyBar = document.getElementById('stickyConversionBar');
  const heroSection = document.getElementById('heroSection');
  if (!stickyBar || !heroSection) return;

  window.addEventListener('scroll', () => {
    const heroBottom = heroSection.getBoundingClientRect().bottom;
    if (heroBottom < 100) {
      stickyBar.classList.add('visible');
    } else {
      stickyBar.classList.remove('visible');
    }
  });
}

/* ==========================================================================
   5. UTILITIES: BROCHURE DOWNLOAD & SMOOTH SCROLL
   ========================================================================== */
function downloadSpecBrochure() {
  trackConversionEvent('download_brochure', {
    document: 'recobro_vigile_technical_specs.pdf'
  });
  // Simulate download alert / link
  alert('Thank you! The official Recobro Vigile® TeleICU specifications brochure is opening in your browser.');
  window.open('assets/images/recobro-vigile-phone.png', '_blank');
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || !targetId) return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.position = 'absolute';
        navLinks.style.top = '76px';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = '#ffffff';
        navLinks.style.flexDirection = 'column';
        navLinks.style.padding = '20px';
        navLinks.style.borderBottom = '1px solid #e2e8f0';
        navLinks.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
      }
    });
  }
}

/* ==========================================================================
   6. CLINICAL SPECIFICATIONS TAB SWITCHER
   ========================================================================== */
function initSpecsTabs() {
  const tabButtons = document.querySelectorAll('.specs-tab-btn');
  const tabPanels = document.querySelectorAll('.specs-tab-panel');

  if (!tabButtons.length || !tabPanels.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      // Update button active state & aria-selected
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panels active state
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(targetTabId);
      if (activePanel) {
        activePanel.classList.add('active');
      }

      // Track interaction for analytics
      if (typeof trackConversionEvent === 'function') {
        trackConversionEvent('view_spec_tab', { tab_category: targetTabId });
      }
    });
  });
}

/* ==========================================================================
   7. CARE ENVIRONMENTS TAB SWITCHER
   ========================================================================== */
function initEnvironmentTabs() {
  const tabButtons = document.querySelectorAll('.env-tab-btn');
  const tabPanels = document.querySelectorAll('.env-tab-panel');

  if (!tabButtons.length || !tabPanels.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');

      // Update button active state & aria-selected
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panels active state
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(targetTabId);
      if (activePanel) {
        activePanel.classList.add('active');
      }

      // Track interaction for analytics
      if (typeof trackConversionEvent === 'function') {
        trackConversionEvent('view_environment_tab', { environment: targetTabId });
      }
    });
  });
}


