(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const entered = new WeakSet();
  const registered = new WeakSet();
  let photos = [];
  let frame = 0;
  let scanFrame = 0;

  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      observer.unobserve(target);
      if (entered.has(target)) continue;
      entered.add(target);
      if (!reduced.matches) target.classList.add('el-gentle-enter');
    }
  }, { threshold: 0, rootMargin: '0px 0px 80px 0px' }) : null;

  function updatePhotos() {
    frame = 0;
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
      // Overscan covers the offset even in the smallest mobile product photos.
      const limit = Math.min(6, bounds.height * 0.025);
      const progress = (height / 2 - bounds.top - bounds.height / 2) / height;
      const offset = Math.max(-limit, Math.min(limit, progress * 12));
      photo.style.setProperty('--el-gentle-photo-y', `${offset.toFixed(2)}px`);
    }
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(updatePhotos);
  }

  function scan() {
    scanFrame = 0;
    document.querySelectorAll('.sc-host main section').forEach(section => {
      if (registered.has(section)) return;
      registered.add(section);
      // Unobserved content is already visible; this only adds an 8px movement.
      observer?.observe(section);
    });
    photos = [...document.querySelectorAll('.sc-host main .el-photo-frame > img, .sc-host main .el-product-card__photo img')];
    photos.forEach(photo => photo.classList.add('el-gentle-photo'));
    schedule();
  }

  document.addEventListener('animationend', event => {
    if (event.animationName === 'el-gentle-rise') event.target.classList.remove('el-gentle-enter');
  });
  new MutationObserver(() => {
    if (!scanFrame) scanFrame = requestAnimationFrame(scan);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', () => {
    if (reduced.matches) document.querySelectorAll('.el-gentle-enter').forEach(section => section.classList.remove('el-gentle-enter'));
    schedule();
  });
  scan();
})();
