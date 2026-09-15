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

const metricFills = document.querySelectorAll('.metric-fill');
const metricsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const fill = entry.target;
      const width = fill.getAttribute('data-width');
      fill.style.width = width + '%';
      metricsObserver.unobserve(fill);
    }
  });
}, { threshold: 0.3 });
metricFills.forEach(el => metricsObserver.observe(el));

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
let heroRect;
function updateHeroRect() {
  heroRect = hero.getBoundingClientRect();
  const nextHeroHeight = hero.offsetHeight;
  if (nextHeroHeight !== heroHeight) {
    heroHeight = nextHeroHeight;
    if (!navbarRaf) navbarRaf = requestAnimationFrame(updateNavbar);
  }
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
window.addEventListener('resize', updateHeroRect, { passive: true });
heroMotionQuery.addEventListener('change', syncHeroMotion);
syncHeroMotion();

const ambientMotionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => entry.target.classList.toggle('motion-visible', entry.isIntersecting));
}, { rootMargin: '160px 0px' });
const howSection = document.getElementById('how');
if (howSection) ambientMotionObserver.observe(howSection);

const leadForm = document.getElementById('leadForm');
const formSuccess = document.getElementById('formSuccess');
leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fname = document.getElementById('fname').value.trim();
  const femail = document.getElementById('femail').value.trim();
  const fphone = document.getElementById('fphone').value.trim();
  const fcompany = document.getElementById('fcompany').value.trim();
  if (!fname || !femail || !fphone || !fcompany) {
    const inputs = leadForm.querySelectorAll('input[required]');
    inputs.forEach(input => {
      if (!input.value.trim()) {
        input.style.borderColor = '#F03D30';
        input.addEventListener('input', () => { input.style.borderColor = ''; }, { once: true });
      }
    });
    return;
  }
  const btn = leadForm.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Enviando…';
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
    btn.disabled = false;
    btn.textContent = 'Solicitar demo gratuita →';
    alert('Hubo un error al enviar. Intenta de nuevo o contáctanos por WhatsApp.');
  }
});

(function() {
  const story = document.querySelector('.app-story');
  if (!story) return;

  const panels = story.querySelectorAll('.app-panel');
  const slides = story.querySelectorAll('.phone-story-slide');
  const dots   = story.querySelectorAll('.story-dot');
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
    if (storyNearViewport && step + 1 < slides.length) void loadSlide(step + 1);
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

  dots.forEach((dot, i) => {
    dot.addEventListener('pointerenter', () => { void loadSlide(i); }, { passive: true });
    dot.addEventListener('focus', () => { void loadSlide(i); });
    dot.addEventListener('touchstart', () => { void loadSlide(i); }, { passive: true });
    dot.addEventListener('click', () => {
      setStep(i);
    });
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
