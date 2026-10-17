/* Local home menu: anchor navigation keeps every dish on the page. */
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let nav = null, frame = 0, scrollFrame = 0, navigating = false;
  let pendingHash = '', destination = null;
  let observedNav = null;
  const decodeHash = () => {
    try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; }
  };
  const hasRestoredPosition = () => history.state?.easylineCatalog?.route === 'home';
  const primaryOffset = () => (document.querySelector('.el-main-header')?.getBoundingClientRect().height || 0)
    + (nav?.getBoundingClientRect().height || 0);
  const offset = target => primaryOffset() + 18 + (target?.classList.contains('el-home-menu-group')
    ? target.closest('.el-home-menu-section')?.querySelector('.el-home-subcategories')?.getBoundingClientRect().height || 0 : 0);
  const headingFor = target => target.querySelector('h2,h3') || target;
  const topFor = target => Math.max(0, Math.min(window.scrollY + headingFor(target).getBoundingClientRect().top - offset(target),
    document.documentElement.scrollHeight - window.innerHeight));

  function stop() {
    cancelAnimationFrame(scrollFrame);
    scrollFrame = 0;
    destination = null;
    delete document.documentElement.dataset.elHomeScrolling;
  }

  function selectRow(row,id) {
    if (!row) return;
    row.querySelectorAll('[data-home-anchor]').forEach(link => {
      if (link.dataset.homeAnchor === id) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    });
    if (row.dataset.current === id) return;
    row.dataset.current = id || '';
    const link = row.querySelector('[aria-current]');
    if (!link) { row.scrollTo({ left:0, behavior:'instant' }); return; }
    const r = row.getBoundingClientRect(), b = link.getBoundingClientRect();
    row.scrollTo({ left:row.scrollLeft + b.left - r.left - (r.width - b.width) / 2,
      behavior:reduced.matches ? 'instant' : 'smooth' });
  }

  function select(id) {
    if (!nav) return;
    const target = document.getElementById(id);
    const section = target?.closest('.el-home-menu-section');
    selectRow(nav.querySelector('.el-home-category-nav__primary'),section?.id || id);
    document.querySelectorAll('.el-home-subcategories').forEach(bar => {
      const selected = section?.contains(bar);
      const child = target?.classList.contains('el-home-menu-group') ? id : section?.querySelector('.el-home-menu-group')?.id;
      selectRow(bar.querySelector('.el-home-subcategories__track'),selected ? child : '');
    });
  }

  function finish(target, focus) {
    stop();
    window.scrollTo({ top:topFor(target), left:0, behavior:'instant' });
    select(target.id);
    if (focus) target.querySelector('h2,h3')?.focus({ preventScroll:true });
    schedule();
  }

  function jump(target, animate, focus = true) {
    stop();
    // Section entry movement must not change the destination during a jump.
    document.querySelectorAll('.el-home-menu-content .el-gentle-enter').forEach(node => node.classList.remove('el-gentle-enter'));
    select(target.id);
    const start = window.scrollY, end = topFor(target), distance = end - start;
    if (!animate || reduced.matches || Math.abs(distance) < 2) { finish(target,focus); return; }
    destination = target;
    document.documentElement.dataset.elHomeScrolling = 'true';
    const duration = Math.min(440,260 + Math.abs(distance) * .06), started = performance.now();
    function step(now) {
      const progress = Math.min(1,(now - started) / duration);
      const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      window.scrollTo({ top:start + distance * eased, left:0, behavior:'instant' });
      if (progress < 1) scrollFrame = requestAnimationFrame(step);
      else finish(target,focus);
    }
    scrollFrame = requestAnimationFrame(step);
  }

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  const menuObserver = new MutationObserver(schedule);
  function update() {
    frame = 0;
    if (navigating) return;
    const current = document.querySelector('.el-home-category-nav');
    if (current !== nav) {
      stop(); nav = current;
      pendingHash = hasRestoredPosition() ? '' : decodeHash();
    }
    if (nav !== observedNav) {
      resizeObserver?.disconnect(); menuObserver.disconnect(); observedNav = nav;
      if (nav) {
        resizeObserver?.observe(nav);
        const content = document.querySelector('.el-home-menu-content');
        if (content) resizeObserver?.observe(content);
        menuObserver.observe(nav,{ childList:true, subtree:true });
        document.querySelectorAll('.el-home-subcategories').forEach(bar => {
          resizeObserver?.observe(bar);
          menuObserver.observe(bar,{ childList:true, subtree:true });
        });
      }
    }
    if (!nav) { document.documentElement.style.removeProperty('--el-home-nav-height'); return; }
    const height = Math.ceil(nav.getBoundingClientRect().height) + 'px';
    if (document.documentElement.style.getPropertyValue('--el-home-nav-height') !== height)
      document.documentElement.style.setProperty('--el-home-nav-height',height);
    document.querySelectorAll('.el-home-category-nav__primary,.el-home-subcategories__track').forEach(row => {
      const last = row.querySelector('a:last-of-type');
      const space = Math.max(0,(row.clientWidth - (last?.getBoundingClientRect().width || 0)) / 2) + 'px';
      if (row.style.getPropertyValue('--el-nav-end-space') !== space) row.style.setProperty('--el-nav-end-space',space);
    });
    if (pendingHash && nav.dataset.homeMenuReady === 'true') {
      const target = document.getElementById(pendingHash);
      pendingHash = '';
      if (target?.hasAttribute('data-home-section')) { jump(target,false,false); return; }
    }
    document.querySelectorAll('.el-home-subcategories').forEach(bar => {
      bar.dataset.stuck = String(Math.abs(bar.getBoundingClientRect().top - primaryOffset()) <= 2);
    });
    if (destination || document.documentElement.classList.contains('el-product-open')) return;
    const sections = [...document.querySelectorAll('.el-home-menu-section')];
    let currentSection = sections[0];
    for (const section of sections) if (headingFor(section).getBoundingClientRect().top <= primaryOffset() + 22) currentSection = section;
    if (currentSection) {
      let selected = currentSection;
      for (const group of currentSection.querySelectorAll('.el-home-menu-group'))
        if (headingFor(group).getBoundingClientRect().top <= offset(group) + 22) selected = group;
      select(selected.id);
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }

  document.addEventListener('click',event => {
    const link = event.target.closest('a[data-home-anchor]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.dataset.homeAnchor);
    nav = document.querySelector('.el-home-category-nav');
    if (!nav || !target?.hasAttribute('data-home-section')) return;
    event.preventDefault();
    pendingHash = '';
    history.replaceState({ ...history.state },'',location.pathname + location.search + '#' + target.id);
    jump(target,true);
  });
  window.addEventListener('scroll',schedule,{ passive:true });
  window.addEventListener('resize',() => {
    document.querySelectorAll('.el-home-category-nav__primary,.el-home-subcategories__track').forEach(row => delete row.dataset.current);
    schedule();
  },{ passive:true });
  window.addEventListener('wheel',stop,{ passive:true });
  window.addEventListener('touchstart',stop,{ passive:true });
  document.addEventListener('keydown',event => {
    if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' ','Escape'].includes(event.key)) { stop(); schedule(); }
  });
  window.addEventListener('hashchange',() => { pendingHash = decodeHash(); schedule(); });
  window.addEventListener('easyline:render',schedule);
  window.addEventListener('easyline:navigation-start',() => { navigating = true; stop(); });
  window.addEventListener('easyline:navigation-end',() => {
    navigating = false; pendingHash = hasRestoredPosition() ? '' : decodeHash(); schedule();
  });
  reduced.addEventListener('change',() => { if (destination) finish(destination,true); });
  document.fonts?.ready.then(schedule);
  schedule();
})();
