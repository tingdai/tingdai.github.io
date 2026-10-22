// Visitor analytics shared by all pages: Google Analytics 4 and GoatCounter.
// GA4 enhanced measurement already records page views, scrolls, PDF downloads and outbound clicks;
// this file adds the events it cannot see (CV download, email, own profile links) and sends them to both tools.
(function () {
  var GA_ID = 'G-J2P0EFSCRE';
  var GOATCOUNTER = 'tingdai';  // site code from goatcounter.com; empty = GoatCounter off

  // Do not count visits while editing the site locally.
  var host = location.hostname;
  var live = host !== '' && host !== 'localhost' && host !== '127.0.0.1';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }

  function load(src, attrs) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    for (var k in attrs) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }

  if (live) {
    gtag('js', new Date());
    gtag('config', GA_ID);
    load('https://www.googletagmanager.com/gtag/js?id=' + GA_ID, {});
    if (GOATCOUNTER) load('https://gc.zgo.at/count.js', { 'data-goatcounter': 'https://' + GOATCOUNTER + '.goatcounter.com/count' });
  }

  function goat(name, label) {
    if (live && GOATCOUNTER && window.goatcounter && window.goatcounter.count)
      window.goatcounter.count({ path: name + (label ? ':' + label : ''), title: name, event: true });
  }

  // track('cv_download', { cv_type: 'resume' }) sends one event to every enabled tool.
  window.track = function (name, params, label) {
    if (live) gtag('event', name, params || {});
    goat(name, label);
  };

  var PROFILES = [
    ['linkedin', 'linkedin.com/in/ting-dai-'],
    ['scholar', 'scholar.google.com/citations?user=Kv-OQscAAAAJ'],
    ['github', 'github.com/tingdai']
  ];

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.href;
    if (href.indexOf('mailto:') === 0) return window.track('email_click', {}, '');
    for (var i = 0; i < PROFILES.length; i++)
      if (href.indexOf(PROFILES[i][1]) !== -1)
        return window.track('profile_click', { platform: PROFILES[i][0], link_url: href }, PROFILES[i][0]);
    // GA4 records these itself (file_download); GoatCounter needs them sent.
    if (/\.pdf($|[?#])/i.test(href)) goat('pdf_download', href.split('/').pop());
  }, true);
})();
