const navbar = document.getElementById('navbar');
const hero = document.getElementById('hero');
const mobileMenu = document.getElementById('mobileMenu');
let navbarRaf = 0;
let navbarScrolled;
let heroTransitionActive;
let heroMotionVisible;
let heroHeight = hero.offsetHeight;
let lastScrollPosition = window.scrollY;
function updateNavbar() {
  navbarRaf = 0;
  const scrollPosition = window.scrollY;
  const scrollDelta = scrollPosition - lastScrollPosition;
  const nextState = scrollPosition > 30;
  const nextHeroTransition = scrollPosition > 1;
  const nextHeroMotion = scrollPosition < heroHeight;

  if (scrollPosition <= 30 || scrollDelta < -2 || mobileMenu.classList.contains('open')) {
    navbar.classList.remove('nav-hidden');
  } else if (scrollDelta > 4) {
    navbar.classList.add('nav-hidden');
  }
  lastScrollPosition = scrollPosition;

  if (nextHeroTransition !== heroTransitionActive) {
    heroTransitionActive = nextHeroTransition;
    document.body.classList.toggle('hero-transition-active', nextHeroTransition);
  }
  if (nextHeroMotion !== heroMotionVisible) {
    heroMotionVisible = nextHeroMotion;
    hero.classList.toggle('motion-visible', nextHeroMotion);
  }
  if (nextState === navbarScrolled) return;
  navbarScrolled = nextState;
  navbar.classList.toggle('scrolled', nextState);
}
window.addEventListener('scroll', () => {
  if (!navbarRaf) navbarRaf = requestAnimationFrame(updateNavbar);
}, { passive: true });
updateNavbar();

const hamburger = document.getElementById('hamburger');
hamburger.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
  navbar.classList.remove('nav-hidden');
});
mobileMenu.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') mobileMenu.classList.remove('open');
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const animEls = document.querySelectorAll('.anim');
const animationLayerObserver = reducedMotion
  ? null
  : new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) {
          entry.target.classList.remove('anim-ready');
          return;
        }
        if (entry.target.classList.contains('visible')) {
          animationLayerObserver.unobserve(entry.target);
          return;
        }
        entry.target.classList.add('anim-ready');
      });
    }, { rootMargin: '160px 0px' });
if (animationLayerObserver) animEls.forEach(el => animationLayerObserver.observe(el));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      const releaseAnimationLayer = (event) => {
        if (event.target !== entry.target) return;
        entry.target.classList.remove('anim-ready');
        if (animationLayerObserver) animationLayerObserver.unobserve(entry.target);
        entry.target.removeEventListener('transitionend', releaseAnimationLayer);
      };
      entry.target.addEventListener('transitionend', releaseAnimationLayer);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -32px 0px' });
animEls.forEach(el => observer.observe(el));

const analyticsCard = document.querySelector('.feature-card--analytics');
if (analyticsCard) {
  const counters = analyticsCard.querySelectorAll('[data-value]');
  let analyticsAnimationFrame = 0;

  function updateAnalyticsCounters(progress) {
    counters.forEach(counter => {
      const value = Number(counter.dataset.value);
      const decimals = Number(counter.dataset.decimals || 0);
      const prefix = counter.dataset.prefix || '';
      const suffix = counter.dataset.suffix || '';
      counter.textContent = `${prefix}${(value * progress).toFixed(decimals)}${suffix}`;
    });
  }

  function playAnalyticsAnimation() {
    analyticsCard.classList.add('is-dashboard-animated');
    if (reducedMotion) {
      updateAnalyticsCounters(1);
      return;
    }

    const duration = 5200;
    const startTime = performance.now();
    function updateCounters(now) {
      const elapsed = Math.min(1, (now - startTime) / duration);
      const eased = elapsed * elapsed * (3 - (2 * elapsed));
      updateAnalyticsCounters(eased);
      if (elapsed < 1) analyticsAnimationFrame = requestAnimationFrame(updateCounters);
      else analyticsAnimationFrame = 0;
    }
    analyticsAnimationFrame = requestAnimationFrame(updateCounters);
  }

  function replayAnalyticsAnimation() {
    if (analyticsAnimationFrame) cancelAnimationFrame(analyticsAnimationFrame);
    analyticsAnimationFrame = 0;
    analyticsCard.classList.add('is-dashboard-resetting');
    analyticsCard.classList.remove('is-dashboard-animated');
    updateAnalyticsCounters(0);
    void analyticsCard.offsetWidth;
    requestAnimationFrame(() => {
      analyticsCard.classList.remove('is-dashboard-resetting');
      void analyticsCard.offsetWidth;
      requestAnimationFrame(playAnalyticsAnimation);
    });
  }

  updateAnalyticsCounters(0);
  if (reducedMotion) {
    playAnalyticsAnimation();
  } else {
    const analyticsObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      analyticsObserver.unobserve(analyticsCard);
      playAnalyticsAnimation();
    }, { threshold: 0.35 });
    analyticsObserver.observe(analyticsCard);
  }
  analyticsCard.addEventListener('featurefrontshow', replayAnalyticsAnimation);
}

const replayableFeatureAnimations = new Map([
  [document.querySelector('.feature-card--inventory'), 'is-inventory-animated'],
  [document.querySelector('.feature-card--payments'), 'is-payments-animated'],
  [document.querySelector('.feature-card--progress'), 'is-progress-animated'],
  [document.querySelector('.feature-card--marketplace'), 'is-marketplace-animated']
].filter(([card]) => card));

if (!reducedMotion && replayableFeatureAnimations.size) {
  function playFeatureAnimation(card) {
    const className = replayableFeatureAnimations.get(card);
    card.classList.remove(className);
    void card.offsetWidth;
    requestAnimationFrame(() => card.classList.add(className));
  }

  const featureAnimationObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      featureAnimationObserver.unobserve(entry.target);
      playFeatureAnimation(entry.target);
    });
  }, { threshold: 0.35 });

  replayableFeatureAnimations.forEach((className, card) => {
    featureAnimationObserver.observe(card);
    card.addEventListener('featurefrontshow', () => playFeatureAnimation(card));
  });
}

const mobileFeatureCard = document.querySelector('.feature-card--mobile');
if (mobileFeatureCard) {
  let mobileIntroTimer = 0;

  function playMobileFeatureAnimation(isFirstLoad = false) {
    window.clearTimeout(mobileIntroTimer);
    mobileFeatureCard.classList.remove('is-mobile-animated');
    mobileFeatureCard.classList.remove('is-mobile-first-load');
    void mobileFeatureCard.offsetWidth;
    requestAnimationFrame(() => {
      mobileFeatureCard.classList.remove('is-mobile-first-pending');
      mobileFeatureCard.classList.add('is-mobile-animated');
      if (!isFirstLoad) return;
      mobileFeatureCard.classList.add('is-mobile-first-load');
      mobileIntroTimer = window.setTimeout(() => {
        mobileFeatureCard.classList.remove('is-mobile-first-load');
        mobileFeatureCard.classList.remove('is-mobile-animated');
      }, 6500);
    });
  }

  if (reducedMotion) {
    mobileFeatureCard.classList.remove('is-mobile-first-pending');
  } else {
    const mobileFeatureObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      mobileFeatureObserver.unobserve(mobileFeatureCard);
      playMobileFeatureAnimation(true);
    }, { threshold: 0.35 });
    mobileFeatureObserver.observe(mobileFeatureCard);
    mobileFeatureCard.addEventListener('featurefrontshow', () => playMobileFeatureAnimation(false));
  }
}

const featuresGrid = document.querySelector('.features-grid');
const marketplaceCard = document.querySelector('.feature-card--marketplace');
if (marketplaceCard) {
  const filterButton = marketplaceCard.querySelector('.marketplace-filter');
  const filterLabel = marketplaceCard.querySelector('.marketplace-filter-label');
  const filterMenu = marketplaceCard.querySelector('.marketplace-filter-menu');
  const filterOptions = marketplaceCard.querySelectorAll('[data-marketplace-filter]');
  const propertyMarkers = marketplaceCard.querySelectorAll('.marketplace-marker');
  const propertyPopover = marketplaceCard.querySelector('.marketplace-property-popover');
  const propertyType = propertyPopover.querySelector('.marketplace-property-type');
  const propertyName = propertyPopover.querySelector('.marketplace-property-name');
  const propertyMeta = propertyPopover.querySelector('.marketplace-property-meta');
  const propertyPrice = propertyPopover.querySelector('.marketplace-property-price');
  let activePropertyMarker = null;

  function closeMarketplaceProperty() {
    propertyMarkers.forEach(marker => marker.setAttribute('aria-expanded', 'false'));
    activePropertyMarker = null;
    propertyPopover.hidden = true;
    propertyPopover.className = 'marketplace-property-popover';
  }

  function showMarketplaceProperty(marker) {
    if (activePropertyMarker === marker) {
      closeMarketplaceProperty();
      return;
    }
    activePropertyMarker = marker;
    propertyMarkers.forEach(item => item.setAttribute('aria-expanded', String(item === marker)));
    propertyType.textContent = marker.dataset.marketplaceType;
    propertyName.textContent = marker.dataset.marketplaceName;
    propertyMeta.textContent = marker.dataset.marketplaceMeta;
    propertyPrice.textContent = marker.dataset.marketplacePrice;
    propertyPopover.className = `marketplace-property-popover is-${marker.dataset.marketplacePosition}`;
    propertyPopover.hidden = false;
  }

  function setMarketplaceFilterOpen(isOpen) {
    if (isOpen) closeMarketplaceProperty();
    filterButton.setAttribute('aria-expanded', String(isOpen));
    filterMenu.hidden = !isOpen;
  }

  filterButton.addEventListener('click', event => {
    event.stopPropagation();
    setMarketplaceFilterOpen(filterButton.getAttribute('aria-expanded') !== 'true');
  });
  filterOptions.forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation();
      filterLabel.textContent = option.dataset.marketplaceFilter;
      filterOptions.forEach(item => item.setAttribute('aria-selected', String(item === option)));
      setMarketplaceFilterOpen(false);
      filterButton.focus();
    });
  });
  propertyMarkers.forEach(marker => {
    marker.addEventListener('click', event => {
      event.stopPropagation();
      setMarketplaceFilterOpen(false);
      showMarketplaceProperty(marker);
    });
    marker.addEventListener('keydown', event => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        closeMarketplaceProperty();
        marker.focus();
      }
    });
  });
  marketplaceCard.querySelector('.marketplace-filter-control').addEventListener('keydown', event => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      setMarketplaceFilterOpen(false);
      filterButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.marketplace-filter-control')) setMarketplaceFilterOpen(false);
    if (!event.target.closest('.marketplace-marker')) closeMarketplaceProperty();
  });
  marketplaceCard.addEventListener('featurefrontshow', () => {
    setMarketplaceFilterOpen(false);
    closeMarketplaceProperty();
  });
}

const mobileFeatureViewer = document.querySelector('[data-mobile-feature]');
if (mobileFeatureViewer) {
  const screens = mobileFeatureViewer.querySelectorAll('[data-mobile-feature-screen]');
  const homeControls = mobileFeatureViewer.querySelector('.mobile-feature-home-controls');
  const backControl = mobileFeatureViewer.querySelector('.mobile-feature-back');

  function showMobileFeatureScreen(screenName) {
    const nextScreen = [...screens].find(screen => screen.dataset.mobileFeatureScreen === screenName);
    if (!nextScreen) return;

    screens.forEach(screen => {
      const isActive = screen === nextScreen;
      screen.classList.toggle('is-active', isActive);
      screen.setAttribute('aria-hidden', String(!isActive));
    });
    mobileFeatureViewer.dataset.activeScreen = screenName;
    if (homeControls) homeControls.hidden = screenName !== 'home';
    if (backControl) backControl.hidden = screenName === 'home';
  }

  mobileFeatureViewer.addEventListener('click', event => {
    const control = event.target.closest('.mobile-feature-control');
    if (!control || !mobileFeatureViewer.contains(control)) return;
    event.stopPropagation();
    if (mobileFeatureCard) {
      mobileFeatureCard.classList.remove('is-mobile-first-load', 'is-mobile-animated');
    }
    showMobileFeatureScreen(control.dataset.mobileTarget || 'home');
  });
  mobileFeatureViewer.addEventListener('keydown', event => event.stopPropagation());
}

function toggleFeatureCard(card) {
  if (card.classList.contains('is-flipping')) return;
  const inner = card.querySelector('.feature-card-inner');
  const front = card.querySelector('.feature-card-front');
  const back = card.querySelector('.feature-card-back');
  const title = front?.querySelector('h3')?.textContent.trim();
  if (!inner || !front || !back || !title) return;

  card.classList.add('is-flipping');
  const isFlipped = card.classList.toggle('is-flipped');
  card.setAttribute('aria-expanded', String(isFlipped));
  card.setAttribute(
    'aria-label',
    `${isFlipped ? 'Ocultar' : 'Ver'} descripción de ${title}`
  );
  if (isFlipped) card.setAttribute('aria-describedby', back.id);
  else card.removeAttribute('aria-describedby');
  front.setAttribute('aria-hidden', String(isFlipped));
  back.setAttribute('aria-hidden', String(!isFlipped));

  let flipFinished = false;
  let flipFallback = 0;
  const finishFlip = () => {
    if (flipFinished) return;
    flipFinished = true;
    window.clearTimeout(flipFallback);
    inner.removeEventListener('transitionend', handleFlipEnd);
    card.classList.remove('is-flipping');
    if (!card.classList.contains('is-flipped')) {
      card.dispatchEvent(new CustomEvent('featurefrontshow'));
    }
  };
  const handleFlipEnd = event => {
    if (event.target !== inner || event.propertyName !== 'transform') return;
    finishFlip();
  };

  if (reducedMotion) {
    requestAnimationFrame(finishFlip);
  } else {
    inner.addEventListener('transitionend', handleFlipEnd);
    flipFallback = window.setTimeout(finishFlip, 720);
  }
}

featuresGrid?.querySelectorAll('.feature-card').forEach(card => {
  const front = card.querySelector('.feature-card-front');
  const back = card.querySelector('.feature-card-back');
  const title = front?.querySelector('h3')?.textContent.trim();
  if (!front || !back || !title) return;
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-expanded', 'false');
  card.setAttribute('aria-controls', back.id);
  card.setAttribute('aria-label', `Ver descripción de ${title}`);
  front.setAttribute('aria-hidden', 'false');
  back.setAttribute('aria-hidden', 'true');
});

featuresGrid?.addEventListener('click', (event) => {
  const card = event.target.closest('.feature-card');
  if (!card || !featuresGrid.contains(card)) return;
  if (event.target.closest('.payment-history-hotspot, .inventory-total-hotspot, .analytics-export-hotspot, .analytics-bar-hotspot, .mobile-feature-control, .marketplace-filter-control, .marketplace-marker')) return;
  toggleFeatureCard(card);
});

featuresGrid?.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  if (event.target.closest('.mobile-feature-control, .marketplace-filter-control, .marketplace-marker')) return;
  const card = event.target.closest('.feature-card');
  if (!card || !featuresGrid.contains(card)) return;
  event.preventDefault();
  toggleFeatureCard(card);
});

(function() {
  const rotator = document.querySelector('.client-logo-rotator');
  if (!rotator) return;

  const groups = rotator.querySelectorAll('[data-client-logo-group]');
  if (groups.length < 2) return;

  let activeGroup = 0;
  let intervalId = 0;
  let cleanupId = 0;
  let isVisible = false;

  function showGroup(index) {
    if (index === activeGroup) return;
    const outgoingGroup = groups[activeGroup];
    const incomingGroup = groups[index];
    activeGroup = index;

    if (cleanupId) clearTimeout(cleanupId);
    outgoingGroup.classList.remove('is-active');
    outgoingGroup.classList.add('is-exiting');
    incomingGroup.classList.remove('is-exiting');
    incomingGroup.classList.add('is-active');

    groups.forEach((group, groupIndex) => {
      const isActive = groupIndex === activeGroup;
      group.setAttribute('aria-hidden', String(!isActive));
    });

    cleanupId = window.setTimeout(() => {
      outgoingGroup.classList.remove('is-exiting');
      cleanupId = 0;
    }, 520);
  }

  function stopRotation() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = 0;
  }

  function startRotation() {
    if (intervalId || !isVisible || document.hidden) return;
    intervalId = window.setInterval(() => {
      showGroup((activeGroup + 1) % groups.length);
    }, 3500);
  }

  const rotatorObserver = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible) startRotation();
    else stopRotation();
  }, { threshold: 0.2 });
  rotatorObserver.observe(rotator);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopRotation();
    else startRotation();
  });
})();

const circles = hero.querySelectorAll('.hero-circle');
const heroMotionQuery = window.matchMedia('(min-width: 901px) and (pointer: fine)');
let heroMotionActive = false;
let heroMotionRaf = 0;
let heroResizeRaf = 0;
let heroRect;
function updateHeroRect() {
  heroRect = hero.getBoundingClientRect();
  const nextHeroHeight = heroRect.height;
  if (nextHeroHeight !== heroHeight) {
    heroHeight = nextHeroHeight;
    if (!navbarRaf) navbarRaf = requestAnimationFrame(updateNavbar);
  }
}
function scheduleHeroRectUpdate() {
  if (heroResizeRaf) return;
  heroResizeRaf = requestAnimationFrame(() => {
    heroResizeRaf = 0;
    updateHeroRect();
  });
}
function updateHeroParallax(e) {
  if (heroMotionRaf) return;
  heroMotionRaf = requestAnimationFrame(() => {
    const cx = (e.clientX - heroRect.left) / heroRect.width - 0.5;
    const cy = (e.clientY - heroRect.top) / heroRect.height - 0.5;
    circles[0].style.transform = `translate(${cx * 24}px, ${cy * 24}px)`;
    circles[1].style.transform = `translate(${-cx * 18}px, ${-cy * 18}px)`;
    heroMotionRaf = 0;
  });
}
function syncHeroMotion() {
  const shouldEnable = !reducedMotion && heroMotionQuery.matches && circles.length >= 2;
  if (shouldEnable === heroMotionActive) return;
  heroMotionActive = shouldEnable;
  if (shouldEnable) {
    updateHeroRect();
    hero.addEventListener('mousemove', updateHeroParallax, { passive: true });
    return;
  }
  hero.removeEventListener('mousemove', updateHeroParallax);
  if (heroMotionRaf) cancelAnimationFrame(heroMotionRaf);
  heroMotionRaf = 0;
}
window.addEventListener('resize', scheduleHeroRectUpdate, { passive: true });
heroMotionQuery.addEventListener('change', syncHeroMotion);
syncHeroMotion();

const ambientMotionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => entry.target.classList.toggle('motion-visible', entry.isIntersecting));
}, { rootMargin: '160px 0px' });
const howSection = document.getElementById('how');
if (howSection) ambientMotionObserver.observe(howSection);

const leadForm = document.getElementById('leadForm');
const formSuccess = document.getElementById('formSuccess');
const leadEmail = document.getElementById('femail');
const leadPhone = document.getElementById('fphone');
const leadRequiredFields = [...leadForm.querySelectorAll('input[required], select[required]')];
const leadTrimFields = [...leadForm.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]')]
  .filter(input => input.name !== '_gotcha');
const leadSubmitButton = leadForm.querySelector('button[type="submit"]');
const leadEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateLeadEmail() {
  const isValid = leadEmailPattern.test(leadEmail.value.trim());
  leadEmail.setCustomValidity(isValid || !leadEmail.value ? '' : 'Ingresa un correo electrónico válido.');
}

function validateLeadPhone() {
  const isValid = /^\d{10}$/.test(leadPhone.value);
  leadPhone.setCustomValidity(isValid || !leadPhone.value ? '' : 'Ingresa un teléfono de 10 dígitos.');
}

leadEmail.addEventListener('input', validateLeadEmail);
leadPhone.addEventListener('input', () => {
  leadPhone.value = leadPhone.value.replace(/\D/g, '').slice(0, 10);
  validateLeadPhone();
});
function clearLeadInvalidState(event) {
  const field = event.target;
  if (!field.matches('input[required], select[required]') || !field.checkValidity()) return;
  field.classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');
}
leadForm.addEventListener('input', clearLeadInvalidState);
leadForm.addEventListener('change', clearLeadInvalidState);
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  leadTrimFields.forEach(input => { input.value = input.value.trim(); });
  validateLeadEmail();
  validateLeadPhone();
  const invalidFields = [];
  leadRequiredFields.forEach(field => {
    const isInvalid = !field.checkValidity();
    field.classList.toggle('is-invalid', isInvalid);
    if (isInvalid) {
      field.setAttribute('aria-invalid', 'true');
      invalidFields.push(field);
    } else {
      field.removeAttribute('aria-invalid');
    }
  });
  if (invalidFields.length) {
    invalidFields[0]?.focus({ preventScroll: true });
    return;
  }
  leadSubmitButton.disabled = true;
  leadSubmitButton.textContent = 'Enviando…';
  const data = new FormData(leadForm);
  try {
    const res = await fetch('https://formspree.io/f/mqerzdna', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
    if (res.ok) {
      leadForm.style.display = 'none';
      formSuccess.style.display = 'block';
    } else {
      throw new Error('server');
    }
  } catch {
    leadSubmitButton.disabled = false;
    leadSubmitButton.textContent = 'Solicitar demo gratuita →';
    alert('Hubo un error al enviar. Intenta de nuevo o contáctanos por WhatsApp.');
  }
});

(function() {
  const story = document.querySelector('.app-story');
  if (!story) return;

  const panels = story.querySelectorAll('.app-panel');
  const slides = story.querySelectorAll('.phone-story-slide');
  const dotsContainer = story.querySelector('.story-dots');
  const dots   = [...story.querySelectorAll('.story-dot')];
  const notificationSets = story.querySelectorAll('.phone-notification-set');
  const phoneShell = story.querySelector('.phone-story-shell');
  const slideLoadPromises = new Map();
  let   current = -1;
  let   requested = -1;
  let   transitionToken = 0;
  let   storyRaf = 0;
  let   storyNearViewport = false;

  function loadSlide(step) {
    const slide = slides[step];
    if (!slide || slide.dataset.loaded === 'true') return Promise.resolve(true);
    if (slideLoadPromises.has(step)) return slideLoadPromises.get(step);

    const source = slide.querySelector('source[data-srcset]');
    const image = slide.querySelector('img[data-src]');
    if (!image) {
      slide.dataset.loaded = 'true';
      return Promise.resolve(true);
    }

    let settled = false;
    const promise = new Promise((resolve) => {
      const finishLoad = () => {
        if (settled) return;
        settled = true;
        const markReady = () => {
          slide.dataset.loaded = 'true';
          resolve(true);
        };
        if (typeof image.decode === 'function') {
          image.decode().catch(() => {}).then(markReady);
        } else {
          markReady();
        }
      };
      const finishError = () => {
        if (settled) return;
        settled = true;
        resolve(false);
      };
      image.addEventListener('load', finishLoad, { once: true });
      image.addEventListener('error', finishError, { once: true });
      queueMicrotask(() => {
        if (image.complete && image.naturalWidth > 1) finishLoad();
      });
    });
    slideLoadPromises.set(step, promise);

    if (source) {
      source.srcset = source.dataset.srcset;
      delete source.dataset.srcset;
    }
    image.src = image.dataset.src;
    delete image.dataset.src;
    return promise;
  }

  function applyStep(step) {
    current = step;
    story.dataset.activeStep = String(step + 1);
    panels.forEach((p, i) => p.classList.toggle('active', i === step));
    slides.forEach((s, i) => s.classList.toggle('active', i === step));
    notificationSets.forEach((set) => {
      const isActive = Number(set.dataset.step) === step;
      set.hidden = !isActive;
      set.classList.toggle('active', isActive);
    });
    dots.forEach((d, i) => {
      const isActive = i === step;
      d.classList.toggle('active', isActive);
      d.setAttribute('aria-pressed', String(isActive));
    });
    phoneShell.classList.toggle('immersive-slide', step === 3);
  }

  function setStep(step) {
    const nextSlide = slides[step + 1];
    if (storyNearViewport && nextSlide && nextSlide.dataset.loaded !== 'true') {
      void loadSlide(step + 1);
    }
    if (step === current) {
      if (requested !== step) {
        requested = step;
        transitionToken++;
      }
      return;
    }
    if (step === requested) return;

    requested = step;
    const token = ++transitionToken;
    loadSlide(step).then((ready) => {
      if (token !== transitionToken || requested !== step) return;
      if (!ready) return;
      applyStep(step);
    });
  }

  function updateStory() {
    storyRaf = 0;
    if (window.innerWidth <= 900) return;
    const rect       = story.getBoundingClientRect();
    if (rect.top >= 0) { setStep(0); return; }
    if (rect.bottom <= window.innerHeight) { setStep(3); return; }
    const scrollable = story.offsetHeight - window.innerHeight;
    if (scrollable <= 0) { setStep(0); return; }
    const scrolled  = Math.max(0, -rect.top);
    const progress  = Math.min(1, scrolled / scrollable);
    const step      = Math.min(3, Math.floor(progress * 4));
    setStep(step);
  }

  function requestStoryUpdate() {
    if (!storyRaf) storyRaf = requestAnimationFrame(updateStory);
  }

  const storyVisibilityObserver = new IntersectionObserver(([entry]) => {
    storyNearViewport = entry.isIntersecting;
    story.classList.toggle('motion-visible', storyNearViewport);
    if (storyNearViewport) void loadSlide(Math.max(1, current + 1));
    requestStoryUpdate();
  }, { rootMargin: '100% 0px' });
  storyVisibilityObserver.observe(story);
  window.addEventListener('scroll', () => {
    if (storyNearViewport) requestStoryUpdate();
  }, { passive: true });
  window.addEventListener('resize', requestStoryUpdate, { passive: true });
  setStep(0);
  updateStory();

  function getDotStep(target) {
    const dot = target.closest('.story-dot');
    return dot ? dots.indexOf(dot) : -1;
  }

  function preloadDot(event) {
    const step = getDotStep(event.target);
    if (step >= 0) void loadSlide(step);
  }

  dotsContainer.addEventListener('pointerover', preloadDot, { passive: true });
  dotsContainer.addEventListener('focusin', preloadDot);
  dotsContainer.addEventListener('touchstart', preloadDot, { passive: true });
  dotsContainer.addEventListener('click', (event) => {
    const step = getDotStep(event.target);
    if (step >= 0) setStep(step);
  });
})();

setTimeout(() => {
  const btn = document.getElementById('waFloat');
  if (btn) {
    btn.addEventListener('transitionend', () => {
      btn.style.willChange = 'auto';
    }, { once: true });
    btn.classList.add('wa-visible');
  }
}, 200);
