const PAGES_BASE = window.location.hostname.endsWith('github.io') ? '/easyline-site' : '';
const IS_0131 = true;
const GENERAL_FAQ = [
  { q:'Какие направления есть в EasyLine?', a:'Корпоративные обеды, ПП-фастфуд, рацион питания на 28 дней и отдельный раздел боулов. В ПП-фастфуде — чиабатты, сэндвичи, бургеры, тортильи, хот-доги и выпечка.' },
  { q:'Чем обеды отличаются от рациона?', a:'В рационе заранее составлены все 28 дней: завтрак, обед и ужин. Корпоративные обеды — отдельные комплекты, которые можно выбрать поштучно.' },
  { q:'Как выбрать блюда?', a:'Откройте корпоративные обеды, ПП-фастфуд или боулы, добавьте нужные позиции в корзину и укажите количество. В рационе меню фиксировано. Подробности уточним перед стартом.' },
  { q:'Где посмотреть стоимость?', a:'Цены корпоративных обедов, ПП-фастфуда и боулов пока уточняются. Итоговая сумма и оформление заказа появятся после публикации цен и условий доставки.' },
  { q:'Как узнать состав и сообщить об аллергии?', a:'В карточках обедов перечислены части комплекта. Полный состав и возможные аллергены уточняйте до заказа по телефону +7 964 018-23-73 или в WhatsApp.' },
];

class Component extends DCLogic {
  state = {
    route:'home', slug:null, menuOpen:false, moreOpen:false, viewportTick:0,
    faqOpen:0, homeFaqOpen:0, data:null, loading:true, error:false,
    catalogLoading:true, catalogError:false, cart:{}, cartAnnouncement:'', cartSaveError:false,
    category:'all', protein:'all', wholegrain:false, search:'', filtersOpen:false, detailsId:null,
    applicationName:'', applicationPhone:'', applicationPrivacy:false,
    applicationSending:false, applicationSent:false, applicationError:'',
  };

  componentDidMount() {
    this._viewportWidth = innerWidth;
    this.syncRouteFromLocation();
    this._onPopState = () => this.syncRouteFromLocation();
    this._onPageHide = () => this.rememberCatalog();
    this._onDocumentPointerDown = (event) => {
      const menu = document.querySelector('.el-more-menu');
      if (this.state.moreOpen && menu && !menu.contains(event.target)) this.setState({ moreOpen:false });
    };
    this._onKeyDown = (event) => {
      if (event.key === 'Tab' && this.state.detailsId) {
        const dialog = document.querySelector('.el-product-dialog');
        const controls = dialog ? [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(node => node.getClientRects().length) : [];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialog?.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !dialog?.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
        return;
      }
      if (event.key === 'Escape') {
        if (this.state.detailsId) { this.closeProductDetails(event); return; }
        const mobileWasOpen = this.state.menuOpen;
        this.setState({ menuOpen:false, moreOpen:false });
        if (mobileWasOpen) requestAnimationFrame(() => document.querySelector('[data-el-menu-toggle]')?.focus());
      }
    };
    this._onResize = () => {
      cancelAnimationFrame(this._resizeFrame);
      this._resizeFrame = requestAnimationFrame(() => {
        if (this._viewportWidth === innerWidth) return;
        this._viewportWidth = innerWidth;
        this.setState(s => ({ viewportTick:s.viewportTick + 1, moreOpen:false, menuOpen:false }));
      });
    };
    this._onStorage = (event) => {
      if (this.catalogModule && event.key === this.catalogModule.CART_STORAGE_KEY) {
        this.setState({ cart:this.catalogModule.decodeCart(event.newValue), cartAnnouncement:'Корзина обновлена.' });
      }
    };
    window.addEventListener('popstate',this._onPopState);
    window.addEventListener('pagehide',this._onPageHide);
    window.addEventListener('beforeunload',this._onPageHide);
    window.addEventListener('resize',this._onResize);
    window.addEventListener('storage',this._onStorage);
    document.addEventListener('pointerdown',this._onDocumentPointerDown);
    document.addEventListener('keydown',this._onKeyDown);
    if (typeof ResizeObserver !== 'undefined') {
      this._headerObserver = new ResizeObserver(() => this.syncCatalogChrome());
      const header = document.querySelector('.el-main-header');
      if (header) this._headerObserver.observe(header);
    }
    document.fonts?.ready.then(() => { this._categoryRevealKey = ''; this.syncCatalogChrome(); });
    this.syncCatalogChrome();
    this.loadProtocol();
    this.loadCatalog();
  }

  componentWillUnmount() {
    window.removeEventListener('popstate',this._onPopState);
    window.removeEventListener('pagehide',this._onPageHide);
    window.removeEventListener('beforeunload',this._onPageHide);
    window.removeEventListener('resize',this._onResize);
    window.removeEventListener('storage',this._onStorage);
    document.removeEventListener('pointerdown',this._onDocumentPointerDown);
    document.removeEventListener('keydown',this._onKeyDown);
    cancelAnimationFrame(this._resizeFrame);
    this._headerObserver?.disconnect();
    document.documentElement?.classList.remove('el-product-open');
  }

  componentDidUpdate() {
    window.dispatchEvent(new CustomEvent('easyline:render'));
    this.syncCatalogChrome();
    if (this._applicationFocusPending && !this._routeNavigationPending) this.focusApplication();
  }

  openProductDetails(id,event) {
    this._detailsOpener = event?.currentTarget;
    this._detailsReturnId = id;
    this.setState({ detailsId:id });
  }

  closeProductDetails(event) {
    event?.preventDefault();
    const opener = this._detailsOpener;
    const id = this._detailsReturnId;
    document.querySelector('.el-product-dialog')?.close();
    this.setState({ detailsId:null },() => requestAnimationFrame(() => {
      const target = opener?.isConnected ? opener : document.querySelector('[data-product-id="' + id + '"] .el-product-details-link');
      target?.focus({ preventScroll:true });
    }));
  }

  productBackdropClick(event) {
    if (event.target !== event.currentTarget) return;
    const r = event.currentTarget.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) this.closeProductDetails(event);
  }

  syncCatalogChrome() {
    const root = document.documentElement;
    if (!root) return;
    const header = document.querySelector('.el-main-header');
    if (header) root.style.setProperty('--el-header-height',Math.ceil(header.getBoundingClientRect().height) + 'px');
    const dock = document.querySelector('.el-cart-dock');
    root.dataset.elCartDock = dock ? 'true' : 'false';
    root.style.setProperty('--el-cart-dock-height',dock ? Math.ceil(dock.getBoundingClientRect().height) + 'px' : '0px');
    const tabs = document.querySelector('.el-category-tabs');
    const key = tabs ? this.state.route + ':' + this.state.category + ':' + innerWidth : '';
    if (tabs && this._categoryRevealKey !== key) {
      const selected = tabs.querySelector('[aria-pressed="true"]');
      if (selected) {
        const nav = tabs.getBoundingClientRect(), button = selected.getBoundingClientRect();
        tabs.scrollLeft += button.left - nav.left - (nav.width - button.width) / 2;
        this._categoryRevealKey = key;
      } else this._categoryRevealKey = '';
    } else if (!tabs) this._categoryRevealKey = '';
    const dialog = document.querySelector('.el-product-dialog');
    root.classList.toggle('el-product-open',!!this.state.detailsId);
    if (dialog && this.state.detailsId && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('.el-product-dialog__close')?.focus({ preventScroll:true });
    }
  }

  loadProtocol() {
    this.setState({ loading:true, error:false });
    const attempt = this._protocolAttempt || 0; this._protocolAttempt = attempt + 1;
    const url = '/easyline-site/assets/menu-data-6F787N4k.js?v=' + encodeURIComponent(window.__EASYLINE_VARIANT__ || '2.6.5') + (attempt ? '&retry=' + attempt : '');
    import(url)
      .then(module => this.setState({ data:{ protocols:module.PROTOCOLS }, loading:false }))
      .catch(() => this.setState({ loading:false, error:true }));
  }

  loadCatalog() {
    this.setState({ catalogLoading:true, catalogError:false });
    const attempt = this._catalogAttempt || 0; this._catalogAttempt = attempt + 1;
    const url = '/easyline-site/assets/__CATALOG_ASSET__' + (attempt ? '?retry=' + attempt : '');
    import(url)
      .then(module => {
        this.catalogModule = module;
        const category = new URLSearchParams(location.search).get('category') || this.state.category;
        this.setState({ catalogLoading:false, cart:module.readCart(), category:module.CATEGORIES.some(item => item.id === category) ? category : 'all' },() => this.restoreCatalogPosition());
      }).catch(() => this.setState({ catalogLoading:false, catalogError:true }));
  }

  routeFromPath(pathname) {
    let path = pathname || '/';
    if (PAGES_BASE && (path === PAGES_BASE || path.startsWith(PAGES_BASE + '/'))) path = path.slice(PAGES_BASE.length) || '/';
    path = path.replace(/\/+$/,'') || '/';
    if (path === '/') return { route:'home', slug:null };
    if (path === '/programs' || path === '/programs/protokol-28') return { route:'program', slug:'protokol-28' };
    if (path === '/corporate-lunches') return { route:'lunches', slug:null };
    if (path === '/assortment') return { route:'assortment', slug:null };
    if (path === '/bowls') return { route:'bowls', slug:null };
    if (path === '/cart') return { route:'cart', slug:null };
    if (path === '/checkout') return { route:'checkout', slug:null };
    if (path === '/faq') return { route:'faq', slug:null };
    if (path === '/reviews') return { route:'reviews', slug:null };
    if (['/about-production','/delivery-payment','/contacts'].includes(path)) return { route:'text', slug:path.slice(1) };
    if (['/legal/privacy','/legal/terms','/legal/offer'].includes(path)) return { route:'legal', slug:path.slice(7) };
    return { route:'notfound', slug:null };
  }

  pathFor(route,slug) {
    const paths = { home:'/', lunches:'/corporate-lunches', assortment:'/assortment', bowls:'/bowls', cart:'/cart', checkout:'/checkout', faq:'/faq', reviews:'/reviews' };
    if (route === 'program') return PAGES_BASE + '/programs/protokol-28/';
    if (route === 'text') return PAGES_BASE + '/' + slug + '/';
    if (route === 'legal') return PAGES_BASE + '/legal/' + slug + '/';
    return PAGES_BASE + (route === 'home' ? '/' : (paths[route] || '/404') + '/');
  }

  catalogFilters(route=this.state.route, filters=this.state) {
    const { category, protein, wholegrain, search } = filters;
    return { category:route === 'assortment' ? category : 'all', protein:route === 'assortment' ? protein : 'all',
      wholegrain:route === 'assortment' && wholegrain, search:route === 'bowls' ? '' : search };
  }

  rememberCatalog() {
    if (!['home','assortment','lunches','bowls'].includes(this.state.route)) return;
    const context = { route:this.state.route, filters:this.catalogFilters(), scroll:window.scrollY, hash:location.hash, filtersOpen:this.state.filtersOpen };
    this._catalogContexts ||= {};
    this._catalogContexts[context.route] = context;
    this._lastCatalogContext = context;
    history.replaceState({ ...history.state, easylineCatalog:context },'',location.href);
  }

  setCatalogFilters(patch) {
    const tabs = document.querySelector('.el-category-tabs');
    const header = document.querySelector('.el-main-header');
    const alignCategory = patch.category != null && tabs && header && tabs.getBoundingClientRect().top <= header.getBoundingClientRect().bottom + 2;
    this.setState({ ...patch, detailsId:null },() => {
      const filters = this.catalogFilters();
      history.replaceState({ ...history.state },'',this.pathFor(this.state.route) + catalogQuery(filters));
      if (alignCategory) requestAnimationFrame(() => {
        const grid = document.querySelector('[data-catalog-grid]');
        const currentHeader = document.querySelector('.el-main-header'), currentTabs = document.querySelector('.el-category-tabs');
        if (grid && currentHeader && currentTabs) window.scrollTo({left:0,top:Math.max(0,window.scrollY + grid.getBoundingClientRect().top - currentHeader.getBoundingClientRect().height - currentTabs.getBoundingClientRect().height - 14),behavior:'instant'});
        this.rememberCatalog();
      });
      else this.rememberCatalog();
    });
  }

  resumeCatalog(event) {
    event?.preventDefault();
    const context = this._lastCatalogContext;
    this.go(context?.route || 'assortment',null,undefined,{ restore:true });
  }

  restoreCatalogPosition() {
    const context = this._pendingCatalogRestore;
    if (!context || !this.catalogModule) return;
    // Wait for the full menu layout, rather than the short loading placeholder.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (this._pendingCatalogRestore !== context || this.state.route !== context.route) return;
      this._pendingCatalogRestore = null;
      window.scrollTo({ left:0, top:context.scroll, behavior:'instant' });
    }));
  }

  syncRouteFromLocation() {
    this._applicationFocusPending = false;
    this._routeNavigationPending = true;
    window.dispatchEvent(new CustomEvent('easyline:navigation-start'));
    if (location.pathname.replace(/\/+$/,'') === PAGES_BASE + '/programs') history.replaceState({},'',this.pathFor('program'));
    let route = this.routeFromPath(location.pathname);
    if (route.route === 'assortment' && new URLSearchParams(location.search).get('category') === 'bowls') {
      history.replaceState({},'',this.pathFor('bowls') + catalogQuery(this.catalogFilters('bowls',readCatalogFilters(location.search))));
      route = this.routeFromPath(location.pathname);
    }
    const isCatalog = ['assortment','lunches','bowls'].includes(route.route);
    const isMenu = isCatalog || route.route === 'home';
    const context = readCatalogContext(history.state?.easylineCatalog);
    const returnContext = readCatalogContext(history.state?.easylineCatalogReturn);
    if (returnContext) {
      this._catalogContexts ||= {};
      this._catalogContexts[returnContext.route] = returnContext;
      this._lastCatalogContext = returnContext;
    }
    this._pendingCatalogRestore = isMenu && context?.route === route.route ? context : null;
    this.setState({ ...route, ...(isCatalog ? this.catalogFilters(route.route,readCatalogFilters(location.search)) : {}),
      menuOpen:false, moreOpen:false, detailsId:null, filtersOpen:context?.filtersOpen || false, faqOpen:0, homeFaqOpen:0 },() => {
      window.__EASYLINE_STATIC_HEAD_SYNC__?.();
      requestAnimationFrame(() => {
        if (isMenu && context?.route === route.route) window.scrollTo({ left:0, top:context.scroll || 0, behavior:'instant' });
        this._routeNavigationPending = false;
        window.dispatchEvent(new CustomEvent('easyline:navigation-end'));
        this.restoreCatalogPosition();
      });
    });
  }

  go(route,slug,category,options={}) {
    this.rememberCatalog();
    this._routeNavigationPending = true;
    if (route !== 'program') this._applicationFocusPending = false;
    window.dispatchEvent(new CustomEvent('easyline:navigation-start'));
    const isCatalog = ['assortment','lunches','bowls'].includes(route);
    const saved = this._catalogContexts?.[route];
    const filters = this.catalogFilters(route,category != null ? { ...CATALOG_FILTER_DEFAULTS, category } : saved?.filters || { ...CATALOG_FILTER_DEFAULTS });
    const path = this.pathFor(route,slug) + (isCatalog ? catalogQuery(filters) : options.restore && route === 'home' ? saved?.hash || '' : '');
    const entryState = { easylineCatalogReturn:this._lastCatalogContext || null,
      ...(options.restore && saved ? { easylineCatalog:saved } : {}) };
    if (location.pathname + location.search + location.hash !== path) history.pushState(entryState,'',path);
    this._pendingCatalogRestore = options.restore && saved && !this.catalogModule ? saved : null;
    this.setState({ route, slug:slug || null, menuOpen:false, moreOpen:false, detailsId:null, faqOpen:0, homeFaqOpen:0,
      ...(isCatalog ? filters : {}), filtersOpen:isCatalog && !!saved?.filtersOpen },() => {
      window.__EASYLINE_STATIC_HEAD_SYNC__?.();
      requestAnimationFrame(() => {
        if (options.restore && saved) {
          window.scrollTo({ left:0, top:saved.scroll || 0, behavior:'instant' });
          const heading = document.querySelector('.el-catalog h1, .el-home-menu h1');
          heading?.setAttribute('tabindex','-1');
          heading?.focus({ preventScroll:true });
        } else {
          window.scrollTo({ left:0, top:0, behavior:'instant' });
          const heading = document.querySelector('main h1');
          heading?.setAttribute('tabindex','-1');
          heading?.focus({ preventScroll:true });
        }
        this._routeNavigationPending = false;
        window.dispatchEvent(new CustomEvent('easyline:navigation-end'));
        if (this._applicationFocusPending) this.focusApplication();
      });
    });
  }

  link(route,slug,category) {
    return event => {
      if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || (event.button && event.button !== 0))) return;
      event?.preventDefault();
      this.go(route,slug,category);
    };
  }

  changeQuantity(id,quantity) {
    if (!this.catalogModule) return;
    const active = document.activeElement;
    const inDialog = !!active?.closest('.el-product-dialog');
    const inQuantityControl = !!active?.closest('.el-product-card,.el-product-dialog,.el-cart-line');
    this.setState(state => {
      const cart = this.catalogModule.setQuantity(state.cart,id,quantity);
      const item = this.catalogModule.CATALOG.find(item => item.id === id);
      const count = cart[id] || 0;
      return { cart, cartSaveError:!this.catalogModule.writeCart(cart),
        cartAnnouncement:count ? item.name + ': ' + count + ' шт. в корзине.' : item.name + ': удалено из корзины.' };
    }, () => {
      if (inQuantityControl && (!active.isConnected || active.disabled)) requestAnimationFrame(() => {
        const scope = inDialog ? '.el-product-dialog' : '[data-product-id="' + id + '"]';
        const next = document.querySelector(scope + ' .el-product-add')
          || document.querySelector(scope + ' input[type=number]')
          || document.querySelector('[data-cart-id] input[type=number]')
          || document.querySelector('.el-empty-state .el-button');
        next?.focus({ preventScroll:true });
      });
    });
  }

  focusApplication() {
    const heading = document.getElementById('application-title');
    const section = document.getElementById('application');
    if (!heading || !section) return;
    this._applicationFocusPending = false;
    heading.focus({ preventScroll:true });
    section.scrollIntoView({ behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block:'start' });
  }

  openOrder(event) {
    event?.preventDefault();
    this._applicationFocusPending = true;
    if (this.state.route !== 'program') this.go('program','protokol-28');
    else this.focusApplication();
  }

  submitApplication(event) {
    event.preventDefault();
    if (this.state.applicationSending) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const client = window.__EASYLINE_LEADS__;
    if (!client) { this.setState({ applicationError:'Не удалось отправить заявку. Позвоните: +7 964 018-23-73.' }); return; }
    const payload = Object.fromEntries(new FormData(form));
    const idempotencyKey = form.dataset.idempotencyKey || crypto.randomUUID();
    form.dataset.idempotencyKey = idempotencyKey;
    this.setState({ applicationSending:true, applicationSent:false, applicationError:'' });
    client.submitInquiry({ idempotencyKey, name:payload.name, phone:payload.phone }).then(() => {
      form.reset(); delete form.dataset.idempotencyKey;
      this.setState({ applicationSending:false, applicationSent:true, applicationName:'', applicationPhone:'', applicationPrivacy:false });
    }).catch(error => this.setState({ applicationSending:false, applicationError:error?.code === 'rate_limited'
      ? 'Слишком много попыток. Попробуйте позже или напишите в WhatsApp.'
      : 'Не удалось отправить заявку. Проверьте данные или свяжитесь с нами.' }));
  }

  renderVals() {
    const S = this.state, M = this.catalogModule;
    const href = (route,slug) => this.pathFor(route,slug);
    const primary = [ ['Корпоративные обеды','lunches'], ['ПП-фастфуд','assortment'], ['Рацион 28 дней','program','protokol-28'], ['Боулы','bowls'] ];
    const secondary = [ ['FAQ','faq'], ['О производстве','text','about-production'], ['Доставка и оплата','text','delivery-payment'], ['Контакты','text','contacts'] ];
    const nav = ([label,route,slug]) => ({ label, href:href(route,slug), onClick:this.link(route,slug),
      color:S.route === route && (!slug || S.slug === slug) ? '#0f4d7a' : '#8e242e',
      rule:S.route === route && (!slug || S.slug === slug) ? '#8e242e' : 'transparent' });
    const protocols = S.data ? S.data.protocols.filter(p => p.slug === 'protokol-28') : [];
    const prog = protocols[0];
    const catalog = M?.CATALOG || [];
    const summary = M ? M.summarizeCart(S.cart) : { lines:[], count:0, totalRub:null };
    const card = item => {
      const quantity = S.cart[item.id] || 0;
      return { ...item, quantity, inCart:quantity > 0, atLimit:quantity >= 99, atZero:quantity === 0,
        showQuantity:quantity > 0 || S.route === 'lunches' || (S.route === 'home' && item.direction === 'corporate-lunches'), hasPrice:Number.isFinite(item.priceRub),
        quantityLabel:'Количество: ' + item.name, quantityCaption:item.direction === 'corporate-lunches' ? 'Порций' : '',
        setQuantity:event => { const quantity = parseItemQuantity(event.target.value); if (quantity !== null) this.changeQuantity(item.id,quantity); },
        restoreQuantity:event => { event.target.value = String(this.state.cart[item.id] || 0); },
        detailsId:'details-' + item.id, detailsOpen:S.detailsId === item.id, detailsTabIndex:S.detailsId === item.id ? 0 : -1, detailsLabel:'Подробнее: ' + item.name, photoDetailsLabel:'Открыть блюдо: ' + item.name,
        detailsText:item.direction === 'corporate-lunches' ? 'Состав и порция' : 'О блюде',
        toggleDetails:event => this.openProductDetails(item.id,event),
        closeDetailsLabel:'Закрыть состав: ' + item.name,
        closeDetails:event => this.closeProductDetails(event),
        inquiryHref:'https://wa.me/79640182373?text=' + encodeURIComponent('Здравствуйте! Подскажите полный состав, массу порции и аллергены блюда «' + item.name + '».'),

        hasImage:!!item.image, imageAlt:(item.imageNote ? 'Предварительная иллюстрация: ' : '') + item.name,
        priceLabel:item.priceRub == null ? 'Цена уточняется' : item.priceRub.toLocaleString('ru-RU') + ' ₽',
        eyebrow:item.direction === 'corporate-lunches' ? 'Обед ' + item.number : item.direction === 'bowls' ? 'Боулы' : (M?.CATEGORIES.find(category => category.id === item.category)?.label || ''),
        addLabel:'Добавить в корзину: ' + item.name,
        plusLabel:'Увеличить количество: ' + item.name, minusLabel:'Уменьшить количество: ' + item.name, removeLabel:'Удалить: ' + item.name,
        add:() => this.changeQuantity(item.id,(this.state.cart[item.id] || 0) + 1),
        minus:() => this.changeQuantity(item.id,(this.state.cart[item.id] || 0) - 1),
        remove:() => this.changeQuantity(item.id,0),
      };
    };
    const allCategories = [{ id:'all', label:'Все', count:M ? catalog.filter(item => item.direction === 'assortment').length : 23 }, ...(M?.CATEGORIES || [])];
    const categories = allCategories.map(category => ({ ...category, selected:S.category === category.id,
      select:() => this.setCatalogFilters({ category:category.id }), href:href('assortment') + '?category=' + category.id, open:this.link('assortment',null,category.id) }));
    const filtered = M ? M.filterCatalog({ direction:S.route === 'lunches' ? 'corporate-lunches' : S.route === 'bowls' ? 'bowls' : 'assortment', category:S.route === 'assortment' ? S.category : 'all',
      protein:S.route === 'assortment' ? S.protein : 'all', wholegrain:S.route === 'assortment' && S.wholegrain, search:S.route === 'bowls' ? '' : S.search }) : [];
    const faqItems = GENERAL_FAQ.concat(FAQ.map(item => ({ ...item, q:item.q === 'Когда привозят еду?' ? 'Когда доставляют рацион на 28 дней?' : item.q })));
    const faqBuild = (key,items) => items.map((item,i) => ({ ...item, isOpen:S[key] === i, sign:S[key] === i ? '−' : '+',
      buttonId:key + '-question-' + i, panelId:key + '-answer-' + i, toggle:() => this.setState({ [key]:this.state[key] === i ? -1 : i }) }));
    const selectedLegal = LEGAL.find(item => item.type === S.slug) || LEGAL[0];
    const proteinNames = { chicken:'Курица', turkey:'Индейка', beef:'Говядина', shrimp:'Креветка' };
    const teamLines = summary.lines.filter(item => item.direction === 'corporate-lunches');
    const teamCount = teamLines.reduce((sum,item) => sum + item.quantity,0);
    const lastCatalog = this._lastCatalogContext;

    const isNotFound = S.route === 'notfound';
    const showProtocolError = S.route === 'program' && S.error;
    return {
      frameMax:'100vw', isWide:innerWidth > 1080, isNarrow:innerWidth <= 1080, is0131:true,
      isHome:S.route === 'home', isProgram:S.route === 'program' && !!prog, isText:S.route === 'text', isLegal:S.route === 'legal',
      isFaq:S.route === 'faq', isReviews:S.route === 'reviews', isNotFound, isCatalog:['lunches','assortment','bowls'].includes(S.route),
      showTeamSearchCount:S.route === 'lunches' && !!S.search,
      isCartPage:['cart','checkout'].includes(S.route), isAssortment:S.route === 'assortment', isBowls:S.route === 'bowls', isIndividualCatalog:['assortment','bowls'].includes(S.route), isLunches:S.route === 'lunches', isCart:S.route === 'cart', isCheckout:S.route === 'checkout',
      showApplicationForm:S.route === 'program' && !!prog,
      navItems:primary.map(nav), topNav:secondary.map(nav), allNav:primary.concat(secondary).map(nav),
      menuOpen:S.menuOpen, moreOpen:S.moreOpen,
      toggleMenu:() => this.setState({ menuOpen:!this.state.menuOpen, moreOpen:false }),
      toggleMore:() => this.setState({ moreOpen:!this.state.moreOpen, menuOpen:false }),
      handleMoreTriggerKeyDown:event => { if (event.key === 'ArrowDown') { event.preventDefault(); this.setState({ moreOpen:true },() => requestAnimationFrame(() => document.querySelector('#desktop-more-menu a')?.focus())); } },
      handleMoreMenuKeyDown:event => { if (event.key === 'Escape') { event.preventDefault(); this.setState({ moreOpen:false },() => document.querySelector('.el-more-menu__trigger')?.focus()); } },
      showSkipLink:event => event.currentTarget.style.transform = 'translateY(0)',
      hideSkipLink:event => event.currentTarget.style.transform = 'translateY(-160%)', disableSocial:event => event.preventDefault(),
      hrefHome:href('home'), goHome:this.link('home'), hrefPrograms:href('program','protokol-28'), goPrograms:this.link('program','protokol-28'),
      hrefLunches:href('lunches'), goLunches:this.link('lunches'), hrefAssortment:href('assortment'), goAssortment:this.link('assortment'),
      hrefBowls:href('bowls'), goBowls:this.link('bowls'),
      hrefCart:href('cart'), goCart:this.link('cart'), hrefCheckout:href('checkout'), goCheckout:this.link('checkout'),
      hrefFaq:href('faq'), goFaq:this.link('faq'), hrefPrivacy:href('legal','privacy'), goPrivacy:this.link('legal','privacy'),
      hrefProduction:href('text','about-production'), goProduction:this.link('text','about-production'),
      hrefDelivery:href('text','delivery-payment'), goDelivery:this.link('text','delivery-payment'),
      openOrder:event => this.openOrder(event), submitApplication:event => this.submitApplication(event),
      applicationSending:S.applicationSending, applicationSent:S.applicationSent, applicationError:S.applicationError,
      applicationButton:S.applicationSending ? 'Отправляем…' : 'Отправить заявку',
      loading:S.loading && S.route === 'program', showProtocolError, retry:() => this.loadProtocol(),
      prog:prog ? { ...prog, image:'/easyline-site/assets/photos/protocol-protokol-28.jpg', imageAlt:'Рацион 28 дней: готовый рацион EasyLine' } : {},
      goStorage:event => { event.preventDefault(); this.go('faq'); const index=faqItems.findIndex(item => item.q === 'Как хранить и разогревать рационы?'); this.setState({faqOpen:index},() => requestAnimationFrame(() => { const question=document.getElementById('faqOpen-question-'+index); question?.focus(); })); },

      homeLunches:catalog.filter(item => item.direction === 'corporate-lunches').map(card),
      homeMenuGroups:(M?.CATEGORIES || []).map(category => ({ ...category, target:'home-' + category.id, headingId:'home-' + category.id + '-title', href:'#home-' + category.id, items:catalog.filter(item => item.direction === 'assortment' && item.category === category.id).map(card) })),
      homeBowls:catalog.filter(item => item.direction === 'bowls').map(card),
      catalogGridClass:'el-product-grid' + (S.route === 'bowls' ? ' el-large-photo-cards' : ''),
      catalogItems:filtered.map(card), catalogEmpty:!S.catalogLoading && !S.catalogError && !filtered.length,
      catalogReady:!S.catalogLoading && !S.catalogError, catalogLoading:S.catalogLoading, catalogError:S.catalogError, retryCatalog:() => this.loadCatalog(),
      catalogTitle:S.route === 'lunches' ? 'Корпоративные обеды' : S.route === 'bowls' ? 'Боулы' : 'ПП-фастфуд',
      catalogIntro:S.route === 'lunches' ? '13 готовых комплектов для обеда. Выберите блюда и укажите количество.' : S.route === 'bowls' ? 'Боулы с курицей, индейкой или креветкой.' : '23 позиции для вашего дня. Выберите категорию, начинку и хлеб.',
      resultCount:filtered.length + ' ' + (filtered.length % 100 >= 11 && filtered.length % 100 <= 14 ? 'позиций' : filtered.length % 10 === 1 ? 'позиция' : [2,3,4].includes(filtered.length % 10) ? 'позиции' : 'позиций'), search:S.search, setSearch:event => this.setCatalogFilters({ search:event.target.value }),
      categories, homeCategories:categories.slice(1), protein:S.protein, setProtein:event => this.setCatalogFilters({ protein:event.target.value }),
      wholegrain:S.wholegrain, setWholegrain:event => this.setCatalogFilters({ wholegrain:event.target.checked }),
      clearFilters:() => this.setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS }),
      filtersOpen:S.filtersOpen, toggleFilters:() => this.setState({ filtersOpen:!this.state.filtersOpen }),
      activeFilterCount:Number(S.protein !== 'all') + Number(S.route === 'assortment' && S.wholegrain), hasProteinFilter:S.protein !== 'all', proteinLabel:proteinNames[S.protein] || '',
      clearProteinLabel:'Убрать фильтр: ' + (proteinNames[S.protein] || ''), clearProtein:() => this.setCatalogFilters({ protein:'all' }),
      clearWholegrain:() => this.setCatalogFilters({ wholegrain:false }), clearSecondaryFilters:() => this.setCatalogFilters({ protein:'all', wholegrain:false }),
      showTeamSelection:S.route === 'lunches' && teamCount > 0,
      showCartDock:['home','lunches','assortment','bowls'].includes(S.route) && summary.count > 0,
      cartDockTitle:'Корзина · ' + summary.count + ' шт.',
      cartDockDetail:summary.lines.length + ' ' + quantityWord(summary.lines.length,'блюдо','блюда','блюд'),
      cartDockLabel:'Открыть корзину: ' + summary.count + ' шт.',
      showProductDetails:!!S.detailsId, detailItems:catalog.filter(item => item.id === S.detailsId).map(card),
      closeProductDetails:event => this.closeProductDetails(event),
      productBackdropClick:event => this.productBackdropClick(event),
      teamSelectionLabel:'Выбрано ' + teamCount + ' ' + quantityWord(teamCount,'обед','обеда','обедов'),
      teamLineLabel:teamLines.length + ' ' + quantityWord(teamLines.length,'комплект','комплекта','комплектов'),
      hrefContinue:lastCatalog ? href(lastCatalog.route) + (lastCatalog.route === 'home' ? lastCatalog.hash || '' : catalogQuery(lastCatalog.filters)) : href('assortment'), goContinue:event => this.resumeCatalog(event),
      applicationName:S.applicationName, applicationPhone:S.applicationPhone, applicationPrivacy:S.applicationPrivacy,
      setApplicationName:event => this.setState({applicationName:event.target.value,applicationSent:false}),
      setApplicationPhone:event => this.setState({applicationPhone:event.target.value,applicationSent:false}),
      setApplicationPrivacy:event => this.setState({applicationPrivacy:event.target.checked}),

      cartCount:summary.count, cartLabel:'Корзина: ' + summary.count + ' шт.', cartAnnouncement:S.cartAnnouncement,
      cartItems:summary.lines.map(card), hasCart:summary.lines.length > 0, cartEmpty:!S.catalogLoading && !S.catalogError && !summary.lines.length,
      cartTotal:summary.totalRub == null ? 'Стоимость уточняется' : summary.totalRub.toLocaleString('ru-RU') + ' ₽',
      cartSaveError:S.cartSaveError,
      preventCheckout:event => event.preventDefault(),
      homeFaq:faqBuild('homeFaqOpen',GENERAL_FAQ), faq:faqBuild('faqOpen',faqItems),
      textPage:TEXT_PAGES[S.slug] || TEXT_PAGES['about-production'],
      legalDocs:LEGAL.map(item => ({ ...item, href:href('legal',item.type), open:this.link('legal',item.type), current:item.type === S.slug ? 'page' : undefined, color:'#0f4d7a' })),
      legal:{ ...selectedLegal, note:'Официальный документ опубликован без изменений.', body:LEGAL_BODY },
      hasReviews:false, reviewsEmpty:true, reviews:[],
      footerSections:primary.concat([['Отзывы','reviews'],['FAQ','faq'],['Контакты','text','contacts']]).map(nav),
      footerDocs:LEGAL.map(item => ({ label:item.title, href:href('legal',item.type), onClick:this.link('legal',item.type) })),
    };
  }
}
