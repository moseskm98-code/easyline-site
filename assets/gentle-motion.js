(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entered = new WeakSet();
  let registered = new WeakSet();
  let photoOrigins = new WeakMap();
  let navigating = false;
  const photoSelector = '.sc-host main .el-photo-frame:not(.el-protocol-hero) > img';
  let photos = [];
  let frame = 0;
  let scanFrame = 0;

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (navigating || !target.isConnected) continue;
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (entered.has(target)) continue;
      entered.add(target);
      if (!reduced.matches) target.classList.add('el-gentle-enter');
    }
  }, { threshold: 0, rootMargin: '0px 0px 24px 0px' }) : null;

  function updatePhotos() {
    frame = 0;
    if (navigating) return;
    const height = Math.max(window.innerHeight, 1);
    document.documentElement.dataset.elGentleMotion = reduced.matches ? 'off' : 'on';
    for (const photo of photos) {
      if (!photo.isConnected) continue;
      if (reduced.matches) {
        photo.style.removeProperty('--el-gentle-photo-y');
        continue;
      }
      const bounds = photo.parentElement.getBoundingClientRect();
      if (bounds.bottom < -120 || bounds.top > height + 120) continue;
      // Photos start at rest. Only scrolling creates a parallax offset.
      const source = photo.getAttribute('data-el-src') || photo.src;
      let origin = photoOrigins.get(photo);
      if (!origin || origin.source !== source) {
        origin = { source, scrollY:window.scrollY };
        photoOrigins.set(photo,origin);
      }
      const limit = Math.min(14, bounds.height * 0.06);
      const offset = Math.max(-limit, Math.min(limit, (window.scrollY - origin.scrollY) * 0.08));
      photo.style.setProperty('--el-gentle-photo-y', `${offset.toFixed(2)}px`);
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(updatePhotos);
  }

  function scan() {
    scanFrame = 0;
    if (navigating) return;
    document.querySelectorAll('.sc-host main section').forEach(section => {
      const bounds = section.getBoundingClientRect();
      if (bounds.top < window.innerHeight + 24 && bounds.bottom > 0) {
        // Content already on screen must never move after its first paint.
        entered.add(section);
        observer?.unobserve(section);
        return;
      }
      if (registered.has(section)) return;
      registered.add(section);
      // Unobserved content is already visible; this only adds a 20px movement.
      observer?.observe(section);
    });
    photos = [...document.querySelectorAll(photoSelector)];
    schedule();
  }

  document.addEventListener('animationend', event => {
    if (event.animationName === 'el-gentle-rise') event.target.classList.remove('el-gentle-enter');
  });
  new MutationObserver(() => {
    if (!scanFrame) scanFrame = requestAnimationFrame(scan);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', scan, { passive: true });
  window.addEventListener('easyline:navigation-start', () => {
    navigating = true;
    observer?.disconnect();
    registered = new WeakSet();
    document.querySelectorAll('.el-gentle-enter').forEach(section => section.classList.remove('el-gentle-enter'));
  });
  window.addEventListener('easyline:navigation-end', () => {
    photoOrigins = new WeakMap();
    navigating = false;
    scan();
  });
  reduced.addEventListener('change', () => {
    photoOrigins = new WeakMap();
    if (reduced.matches) document.querySelectorAll('.el-gentle-enter').forEach(section => section.classList.remove('el-gentle-enter'));
    schedule();
  });
  scan();
})();
