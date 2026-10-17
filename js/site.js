// Theme toggle shared by all pages. Dark is the default; the button names the mode it switches to.
(function () {
  var root = document.documentElement;
  var btn = document.getElementById('theme-btn');
  if (!btn) return;
  function label() {
    var dark = root.dataset.theme === 'dark';
    btn.textContent = dark ? '☀ Light' : '☾ Dark';
    btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
  }
  btn.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
    label();
  });
  label();
})();

// Toggle buttons open the panel named by aria-controls; closed panels are inert so their links are not tabbable.
document.querySelectorAll('.act.toggle').forEach(function (btn) {
  var panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (!panel) return;
  panel.inert = true;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('open', open);
    panel.inert = !open;
  });
});

// Collapsible project cards: a #slug link opens that card; printing opens every card.
(function () {
  function openHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; el.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openHash);
  openHash();
  var closed = [];
  window.addEventListener('beforeprint', function () {
    closed = [].filter.call(document.querySelectorAll('details.proj'), function (d) { return !d.open; });
    closed.forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () { closed.forEach(function (d) { d.open = false; }); });
})();

// Project dock: tracks the .case in view, steps between cases, and links back to that case's row on the list page.
(function () {
  var dock = document.getElementById('dock');
  var cases = [].slice.call(document.querySelectorAll('.case[data-short]'));
  if (!dock || !cases.length) return;
  document.body.classList.add('has-dock');
  var back = dock.querySelector('.dock-back'), now = dock.querySelector('.dock-now');
  var name = now.querySelector('b'), count = now.querySelector('.dock-n');
  var steps = dock.querySelectorAll('.dock-step');
  var head = document.querySelector('.pagehead');
  var list = back.getAttribute('href');
  var arrived = decodeURIComponent(location.hash.slice(1));
  var smooth = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  var cur = -1;

  function show(on) { dock.classList.toggle('on', on); dock.inert = !on; }
  function update() {
    var line = innerHeight * 0.4, i = 0;
    cases.forEach(function (c, k) { if (c.getBoundingClientRect().top < line) i = k; });
    show(head.getBoundingClientRect().bottom < 0);
    if (i === cur) return;
    cur = i;
    name.textContent = cases[i].dataset.short;
    count.textContent = (i + 1) + '/' + cases.length;
    back.href = list + '#' + cases[i].id;
    steps[0].disabled = i === 0;
    steps[1].disabled = i === cases.length - 1;
    now.classList.remove('swap'); void now.offsetWidth; now.classList.add('swap');
    if (dock.classList.contains('on')) history.replaceState(null, '', '#' + cases[i].id);
  }
  var queued = false;
  addEventListener('scroll', function () {
    if (!queued) { queued = true; requestAnimationFrame(function () { queued = false; update(); }); }
  }, { passive: true });
  addEventListener('resize', update);

  steps.forEach(function (b) {
    b.addEventListener('click', function () {
      var c = cases[cur + Number(b.dataset.step)];
      if (c) c.scrollIntoView({ behavior: smooth });
    });
  });
  // Came from the list and still on the same project: go back in history so the list keeps its scroll position.
  back.addEventListener('click', function (e) {
    var ref = document.referrer.split('#')[0];
    if (ref && ref === new URL(list, location.href).href && cases[cur].id === arrived) { e.preventDefault(); history.back(); }
  });
  update();
})();

// BibTeX panels get a Copy button.
document.querySelectorAll('.reveal pre').forEach(function (pre) {
  if (!navigator.clipboard) return;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
  b.addEventListener('click', function () {
    navigator.clipboard.writeText(pre.textContent).then(function () {
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = 'Copy'; }, 1500);
    });
  });
  pre.parentNode.insertBefore(b, pre);
});

// Long author lists: swap the shortened list for the full one.
document.querySelectorAll('.au-more').forEach(function (btn) {
  var full = document.getElementById(btn.getAttribute('aria-controls'));
  var short = full && full.previousElementSibling;
  if (!short) return;
  var label = btn.textContent;
  btn.addEventListener('click', function () {
    var open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    full.hidden = !open; short.hidden = open;
    btn.textContent = open ? 'fewer authors' : label;
  });
});
