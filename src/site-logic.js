const PAGES_BASE = window.location.hostname.endsWith('github.io') ? '/easyline-site' : '';
const IS_0131 = true;
const GENERAL_FAQ = [
  { q:'Какие направления есть в EasyLine?', a:'Протокол питания на 28 дней, корпоративные обеды и ПП-фастфуд: чиабатты, сэндвичи, бургеры, тортильи, боулы и выпечка.' },
  { q:'Чем обеды отличаются от протокола?', a:'В протоколе заранее составлены все 28 дней: завтрак, обед и ужин. Корпоративные обеды — отдельные комплекты, которые можно выбрать поштучно.' },
  { q:'Как выбрать блюда?', a:'Откройте корпоративные обеды или ПП-фастфуд, добавьте нужные позиции в корзину и укажите количество. В протоколе меню фиксировано. Подробности уточним перед стартом.' },
  { q:'Где посмотреть стоимость?', a:'Цены корпоративных обедов и ПП-фастфуда пока уточняются. Итоговая сумма и оформление заказа появятся после публикации цен и условий доставки.' },
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
    this._onDocumentPointerDown = (event) => {
      const menu = document.querySelector('.el-more-menu');
      if (this.state.moreOpen && menu && !menu.contains(event.target)) this.setState({ moreOpen:false });
    };
    this._onKeyDown = (event) => {
      if (event.key === 'Escape') {
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
        this.setState(s => ({ viewportTick:s.viewportTick + 1, moreOpen:false }));
      });
    };
    this._onStorage = (event) => {
      if (this.catalogModule && event.key === this.catalogModule.CART_STORAGE_KEY) {
        this.setState({ cart:this.catalogModule.decodeCart(event.newValue), cartAnnouncement:'Корзина обновлена.' });
      }
    };
    window.addEventListener('popstate',this._onPopState);
    window.addEventListener('resize',this._onResize);
    window.addEventListener('storage',this._onStorage);
    document.addEventListener('pointerdown',this._onDocumentPointerDown);
    document.addEventListener('keydown',this._onKeyDown);
    this.loadProtocol();
    this.loadCatalog();
  }

  componentWillUnmount() {
    window.removeEventListener('popstate',this._onPopState);
    window.removeEventListener('resize',this._onResize);
    window.removeEventListener('storage',this._onStorage);
    document.removeEventListener('pointerdown',this._onDocumentPointerDown);
    document.removeEventListener('keydown',this._onKeyDown);
    cancelAnimationFrame(this._resizeFrame);
  }

  componentDidUpdate() {
    window.dispatchEvent(new CustomEvent('easyline:render'));
    if (this._applicationFocusPending) this.focusApplication();
  }

  loadProtocol() {
    this.setState({ loading:true, error:false });
    const attempt = this._protocolAttempt || 0; this._protocolAttempt = attempt + 1;
    const url = '/easyline-site/assets/menu-data-6F787N4k.js?v=' + encodeURIComponent(window.__EASYLINE_VARIANT__ || '2.4.6') + (attempt ? '&retry=' + attempt : '');
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
        this.setState({ catalogLoading:false, cart:module.readCart(), category:module.CATEGORIES.some(item => item.id === category) ? category : 'all' });
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
    if (path === '/cart') return { route:'cart', slug:null };
    if (path === '/checkout') return { route:'checkout', slug:null };
    if (path === '/faq') return { route:'faq', slug:null };
    if (path === '/reviews') return { route:'reviews', slug:null };
    if (['/about-production','/delivery-payment','/contacts'].includes(path)) return { route:'text', slug:path.slice(1) };
    if (['/legal/privacy','/legal/terms','/legal/offer'].includes(path)) return { route:'legal', slug:path.slice(7) };
    return { route:'notfound', slug:null };
  }

  pathFor(route,slug) {
    const paths = { home:'/', lunches:'/corporate-lunches', assortment:'/assortment', cart:'/cart', checkout:'/checkout', faq:'/faq', reviews:'/reviews' };
    if (route === 'program') return PAGES_BASE + '/programs/protokol-28';
    if (route === 'text') return PAGES_BASE + '/' + slug;
    if (route === 'legal') return PAGES_BASE + '/legal/' + slug;
    return PAGES_BASE + (paths[route] || '/404');
  }

  catalogFilters() {
    const { category, protein, wholegrain, search } = this.state;
    return { category, protein, wholegrain, search };
  }

  rememberCatalog() {
    if (!['assortment','lunches'].includes(this.state.route)) return;
    const context = { route:this.state.route, filters:this.catalogFilters(), scroll:window.scrollY, filtersOpen:this.state.filtersOpen };
    this._catalogContexts ||= {};
    this._catalogContexts[context.route] = context;
    this._lastCatalogContext = context;
    history.replaceState({ ...history.state, easylineCatalog:context },'',location.href);
  }

  setCatalogFilters(patch) {
    this.setState({ ...patch, detailsId:null },() => {
      const filters = this.catalogFilters();
      history.replaceState({ ...history.state },'',this.pathFor(this.state.route) + catalogQuery(filters));
      this.rememberCatalog();
    });
  }

  resumeCatalog(event) {
    event?.preventDefault();
    const context = this._lastCatalogContext;
    this.go(context?.route || 'assortment',null,undefined,{ restore:true });
  }

  syncRouteFromLocation() {
    window.dispatchEvent(new CustomEvent('easyline:navigation-start'));
    if (location.pathname.replace(/\/+$/,'') === PAGES_BASE + '/programs') history.replaceState({},'',PAGES_BASE + '/programs/protokol-28');
    const route = this.routeFromPath(location.pathname);
    const isCatalog = ['assortment','lunches'].includes(route.route);
    const context = history.state?.easylineCatalog;
    this.setState({ ...route, ...(isCatalog ? readCatalogFilters(location.search) : {}),
      menuOpen:false, moreOpen:false, detailsId:null, filtersOpen:context?.filtersOpen || false, faqOpen:0, homeFaqOpen:0 },() => {
      window.__EASYLINE_STATIC_HEAD_SYNC__?.();
      requestAnimationFrame(() => {
        if (isCatalog && context?.route === route.route) window.scrollTo({ left:0, top:context.scroll || 0, behavior:'instant' });
        window.dispatchEvent(new CustomEvent('easyline:navigation-end'));
      });
    });
  }

  go(route,slug,category,options={}) {
    this.rememberCatalog();
    window.dispatchEvent(new CustomEvent('easyline:navigation-start'));
    const isCatalog = ['assortment','lunches'].includes(route);
    const saved = this._catalogContexts?.[route];
    const filters = category != null ? { ...CATALOG_FILTER_DEFAULTS, category } : saved?.filters || { ...CATALOG_FILTER_DEFAULTS };
    const path = this.pathFor(route,slug) + (isCatalog ? catalogQuery(filters) : '');
    if (location.pathname.replace(/\/+$/,'') + location.search !== path.replace(/\/+$/,'')) history.pushState({},'',path);
    this.setState({ route, slug:slug || null, menuOpen:false, moreOpen:false, detailsId:null, faqOpen:0, homeFaqOpen:0,
      ...(isCatalog ? filters : {}), filtersOpen:isCatalog && !!saved?.filtersOpen },() => {
      window.__EASYLINE_STATIC_HEAD_SYNC__?.();
      requestAnimationFrame(() => {
        if (options.restore && saved) {
          window.scrollTo({ left:0, top:saved.scroll || 0, behavior:'instant' });
          const heading = document.querySelector('.el-catalog h1');
          heading?.setAttribute('tabindex','-1');
          heading?.focus({ preventScroll:true });
        } else {
          window.scrollTo({ left:0, top:0, behavior:'instant' });
          const heading = document.querySelector('main h1');
          heading?.setAttribute('tabindex','-1');
          heading?.focus({ preventScroll:true });
        }
        window.dispatchEvent(new CustomEvent('easyline:navigation-end'));
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
    this.setState(state => {
      const cart = this.catalogModule.setQuantity(state.cart,id,quantity);
      const item = this.catalogModule.CATALOG.find(item => item.id === id);
      const count = cart[id] || 0;
      return { cart, cartSaveError:!this.catalogModule.writeCart(cart),
        cartAnnouncement:count ? item.name + ': ' + count + ' шт. в корзине.' : item.name + ': удалено из корзины.' };
    }, () => {
      if (quantity <= 0) requestAnimationFrame(() => {
        const next = document.querySelector('[data-product-id="' + id + '"] .el-product-add')
          || document.querySelector('[data-cart-id] .el-remove-button')
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
    const primary = [ ['Протокол 28 дней','program','protokol-28'], ['Корпоративные обеды','lunches'], ['ПП-фастфуд','assortment'] ];
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
        showQuantity:quantity > 0 || S.route === 'lunches', hasPrice:Number.isFinite(item.priceRub),
        quantityLabel:'Количество: ' + item.name, quantityCaption:item.direction === 'corporate-lunches' ? 'Порций' : '',
        setQuantity:event => { const quantity = parseItemQuantity(event.target.value); if (quantity !== null) this.changeQuantity(item.id,quantity); },
        restoreQuantity:event => { event.target.value = String(this.state.cart[item.id] || 0); },
        detailsId:'details-' + item.id, detailsOpen:S.detailsId === item.id, detailsTabIndex:S.detailsId === item.id ? 0 : -1, detailsLabel:'Подробнее: ' + item.name,
        detailsText:S.route === 'lunches' ? 'Состав и порция' : 'Подробнее о блюде',
        toggleDetails:() => this.setState({ detailsId:this.state.detailsId === item.id ? null : item.id }),
        closeDetailsLabel:'Закрыть состав: ' + item.name,
        closeDetails:() => {
          document.getElementById('details-' + item.id)?.closest('.el-product-card')?.querySelector('.el-product-details-link')?.focus({ preventScroll:true });
          this.setState({ detailsId:null });
        },
        inquiryHref:'https://wa.me/79640182373?text=' + encodeURIComponent('Здравствуйте! Подскажите полный состав, массу порции и аллергены блюда «' + item.name + '».'),

        hasImage:!!item.image, imageAlt:(item.imageNote ? 'Предварительная иллюстрация: ' : '') + item.name,
        priceLabel:item.priceRub == null ? 'Цена уточняется' : item.priceRub.toLocaleString('ru-RU') + ' ₽',
        eyebrow:item.direction === 'corporate-lunches' ? 'Обед ' + item.number : (M?.CATEGORIES.find(category => category.id === item.category)?.label || ''),
        addLabel:'Добавить в корзину: ' + item.name,
        plusLabel:'Увеличить количество: ' + item.name, minusLabel:'Уменьшить количество: ' + item.name, removeLabel:'Удалить: ' + item.name,
        add:() => this.changeQuantity(item.id,(this.state.cart[item.id] || 0) + 1),
        minus:() => this.changeQuantity(item.id,(this.state.cart[item.id] || 0) - 1),
        remove:() => this.changeQuantity(item.id,0),
      };
    };
    const allCategories = [{ id:'all', label:'Все', count:26 }, ...(M?.CATEGORIES || [])];
    const categories = allCategories.map(category => ({ ...category, selected:S.category === category.id,
      select:() => this.setCatalogFilters({ category:category.id }), href:href('assortment') + '?category=' + category.id, open:this.link('assortment',null,category.id) }));
    const filtered = M ? M.filterCatalog({ direction:S.route === 'lunches' ? 'corporate-lunches' : 'assortment', category:S.route === 'lunches' ? 'all' : S.category,
      protein:S.route === 'lunches' ? 'all' : S.protein, wholegrain:S.route === 'assortment' && S.wholegrain, search:S.search }) : [];
    const faqItems = GENERAL_FAQ.concat(FAQ.map(item => ({ ...item, q:item.q === 'Когда привозят еду?' ? 'Когда доставляют протокол на 28 дней?' : item.q })));
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
      isFaq:S.route === 'faq', isReviews:S.route === 'reviews', isNotFound, isCatalog:['lunches','assortment'].includes(S.route),
      showTeamSearchCount:S.route === 'lunches' && !!S.search,
      isCartPage:['cart','checkout'].includes(S.route), isAssortment:S.route === 'assortment', isLunches:S.route === 'lunches', isCart:S.route === 'cart', isCheckout:S.route === 'checkout',
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
      hrefCart:href('cart'), goCart:this.link('cart'), hrefCheckout:href('checkout'), goCheckout:this.link('checkout'),
      hrefFaq:href('faq'), goFaq:this.link('faq'), hrefPrivacy:href('legal','privacy'), goPrivacy:this.link('legal','privacy'),
      hrefProduction:href('text','about-production'), goProduction:this.link('text','about-production'),
      hrefDelivery:href('text','delivery-payment'), goDelivery:this.link('text','delivery-payment'),
      openOrder:event => this.openOrder(event), submitApplication:event => this.submitApplication(event),
      applicationSending:S.applicationSending, applicationSent:S.applicationSent, applicationError:S.applicationError,
      applicationButton:S.applicationSending ? 'Отправляем…' : 'Отправить заявку',
      loading:S.loading && S.route === 'program', showProtocolError, retry:() => this.loadProtocol(),
      prog:prog ? { ...prog, image:'/easyline-site/assets/photos/protocol-protokol-28.jpg', imageAlt:'Протокол 28 дней: готовый рацион EasyLine' } : {},
      goStorage:event => { event.preventDefault(); this.go('faq'); const index=faqItems.findIndex(item => item.q === 'Как хранить и разогревать рационы?'); this.setState({faqOpen:index},() => requestAnimationFrame(() => { const question=document.getElementById('faqOpen-question-'+index); question?.focus(); })); },

      homeLunches:catalog.filter(item => item.direction === 'corporate-lunches').slice(0,4).map(card),
      catalogItems:filtered.map(card), catalogEmpty:!S.catalogLoading && !S.catalogError && !filtered.length,
      catalogReady:!S.catalogLoading && !S.catalogError, catalogLoading:S.catalogLoading, catalogError:S.catalogError, retryCatalog:() => this.loadCatalog(),
      catalogTitle:S.route === 'lunches' ? 'Корпоративные обеды' : 'ПП-фастфуд',
      catalogIntro:S.route === 'lunches' ? '13 готовых комплектов для обеда. Выберите блюда и укажите количество.' : '26 позиций для вашего дня. Выберите категорию, начинку и хлеб.',
      resultCount:filtered.length + ' ' + (filtered.length % 100 >= 11 && filtered.length % 100 <= 14 ? 'позиций' : filtered.length % 10 === 1 ? 'позиция' : [2,3,4].includes(filtered.length % 10) ? 'позиции' : 'позиций'), search:S.search, setSearch:event => this.setCatalogFilters({ search:event.target.value }),
      categories, homeCategories:categories.slice(1), protein:S.protein, setProtein:event => this.setCatalogFilters({ protein:event.target.value }),
      wholegrain:S.wholegrain, setWholegrain:event => this.setCatalogFilters({ wholegrain:event.target.checked }),
      clearFilters:() => this.setCatalogFilters({ ...CATALOG_FILTER_DEFAULTS }),
      filtersOpen:S.filtersOpen, toggleFilters:() => this.setState({ filtersOpen:!this.state.filtersOpen }),
      activeFilterCount:Number(S.protein !== 'all') + Number(S.wholegrain), hasProteinFilter:S.protein !== 'all', proteinLabel:proteinNames[S.protein] || '',
      clearProteinLabel:'Убрать фильтр: ' + (proteinNames[S.protein] || ''), clearProtein:() => this.setCatalogFilters({ protein:'all' }),
      clearWholegrain:() => this.setCatalogFilters({ wholegrain:false }), clearSecondaryFilters:() => this.setCatalogFilters({ protein:'all', wholegrain:false }),
      showTeamSelection:S.route === 'lunches' && teamCount > 0,
      teamSelectionLabel:'Выбрано ' + teamCount + ' ' + quantityWord(teamCount,'обед','обеда','обедов'),
      teamLineLabel:teamLines.length + ' ' + quantityWord(teamLines.length,'комплект','комплекта','комплектов'),
      hrefContinue:lastCatalog ? href(lastCatalog.route) + catalogQuery(lastCatalog.filters) : href('assortment'), goContinue:event => this.resumeCatalog(event),
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
