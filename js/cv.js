/* CV / resume generator. Reads the live site pages at load time, so the PDF always matches the website.
   Sources: index.html (name, headline, summary, contact), Experience.html (work, education, teaching,
   mentoring, service), Projects.html, Publications.html, Awards.html. The only CV text kept here is the
   summary template below, which is filled with live data from those pages. */
(function () {
  'use strict';

  var PAGES = { home: 'index.html', exp: 'Experience.html', proj: 'Projects.html', pubs: 'Publications.html', awards: 'Awards.html' };
  var RESUME_PUBS = 6;                                   // papers listed in resume mode
  var RESUME_AWARD_TAGS = ['industry', 'paper award'];   // award tags kept in resume mode
  var RESUME_AWARD_SKIP = /Accomplishment Nomination|First Patent/;  // minor awards left out of the resume
  var CV_SKIP_ROLES = /Intern/;                          // roles left out of both PDFs (the website still lists them)
  var RESUME_SKIP_ROLES = /Intern|Research Assistant/;  // roles left out of the resume (the Ph.D. covers the RA years)
  var TOP_VENUES = ['NSDI', 'ICML', 'OOPSLA', 'AAAI', 'SoCC'];  // named in the summary when a full paper (not a poster) is there
  // Student-era awards kept in the full CV (the website lists them all).
  var CV_PAST_AWARD_KEEP = /National Scholarship|Outstanding (Master|Bachelor)|Dissertation/;

  var sheet = document.getElementById('cv');
  var params = new URLSearchParams(location.search);
  var mode = params.get('type') === 'resume' ? 'resume' : 'cv';
  var data;

  // ---------- helpers ----------
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function all(root, sel) { return [].slice.call(root.querySelectorAll(sel)); }
  function abs(href) { return href ? new URL(href, location.href).href : ''; }
  // Own text of an element, without the text of the given child selector (e.g. a <small> note).
  function own(el, skip) {
    if (!el) return '';
    var c = el.cloneNode(true);
    all(c, skip).forEach(function (n) { n.remove(); });
    return txt(c);
  }
  // Text with the site owner's name (span.me) and <b> runs in bold; hidden nodes and buttons dropped.
  function rich(el) {
    if (!el) return '';
    var out = '';
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) out += esc(n.nodeValue);
      else if (n.nodeType === 1 && !n.matches('button, [hidden]')) {
        out += n.classList.contains('me') || n.tagName === 'B' ? '<b>' + esc(n.textContent) + '</b>' : rich(n);
      }
    });
    return out.replace(/\s+/g, ' ').trim();
  }
  function link(text, href) { return href ? '<a href="' + esc(href) + '">' + text + '</a>' : text; }
  function svgLabel(el) { var s = el && el.querySelector('svg[aria-label]'); return s ? s.getAttribute('aria-label') : txt(el); }

  // ---------- extraction ----------
  function fromHome(d) {
    var hero = d.querySelector('.hero');
    return {
      name: txt(hero.querySelector('h1')),
      headline: txt(hero.querySelector('.eyebrow')),
      summary: [txt(hero.querySelector('.pitch')), txt(hero.querySelector('.was'))].filter(Boolean),
      expertise: all(d, '#expertise .xg').map(function (g) {
        return { label: txt(g.querySelector('.xk')), chips: all(g, '.chips span').map(txt) };
      }),
      contact: all(hero, '.links a').filter(function (a) { return !/^CV\.html/i.test(a.getAttribute('href')); })
        .map(function (a) {
          var href = a.getAttribute('href');
          return { text: href.indexOf('mailto:') === 0 ? href.slice(7) : own(a, '.k'), href: href };
        })
    };
  }

  function fromExperience(d) {
    var work = [];
    function group(org) {
      var g = work.filter(function (w) { return w.org === org; })[0];
      if (!g) work.push(g = { org: org, roles: [], bullets: [] });
      return g;
    }
    function add(org, title, dates) { group(org).roles.push({ title: title, dates: dates }); }
    function bullets(org, root) { group(org).bullets = group(org).bullets.concat(all(root, '.hl li').map(rich)); }
    var hero = d.querySelector('#work .hero');
    if (hero) {
      var org = svgLabel(hero.querySelector('.lg'));
      add(org, txt(hero.querySelector('.hero-t')), txt(hero.querySelector('.pill.on')));
      all(hero, '.path li:not(.k)').forEach(function (li) { add(org, txt(li.querySelector('.t')), txt(li.querySelector('.d'))); });
      bullets(org, hero);
    }
    all(d, '#work .earlier .panel').forEach(function (p) {
      var org = svgLabel(p.querySelector('.eh'));
      all(p, '.rl li').forEach(function (li) { add(org, txt(li.querySelector('.t')), txt(li.querySelector('.d'))); });
      bullets(org, p);
    });

    function rows(sel) {
      return all(d, sel).map(function (li) {
        var t = li.querySelector('.t');
        return { title: own(t, 'small'), note: txt(t && t.querySelector('small')), dates: txt(li.querySelector('.d')) };
      });
    }
    // Education is one card per school: the school is the card's .k label, the country leads its header span.
    var education = [];
    all(d, '#education .panel').forEach(function (p) {
      var school = txt(p.querySelector('.rl li.k')), country = txt(p.querySelector('.eh .span')).split(' · ')[0];
      all(p, '.rl li:not(.k)').forEach(function (li) {
        var t = li.querySelector('.t');
        education.push({ title: [own(t, 'small'), [school, country].filter(Boolean).join(', ')].filter(Boolean).join(' · '),
          note: txt(t && t.querySelector('small')), dates: txt(li.querySelector('.d')) });
      });
    });
    var mentoring = [];
    all(d, '#mentoring .grp').forEach(function (g) {
      var org = svgLabel(g.querySelector('.lg'));
      all(g, '.rl li').forEach(function (li) {
        var t = li.querySelector('.t');
        mentoring.push({ title: own(t, 'small'), note: [org, txt(t.querySelector('small'))].filter(Boolean).join(' · '), dates: txt(li.querySelector('.d')) });
      });
    });

    return {
      work: work,
      education: education,
      teaching: rows('#teaching .rl li'),
      mentoring: mentoring,
      service: all(d, '#service .sv').map(function (sv) {
        return {
          role: txt(sv.querySelector('.k')),
          venues: all(sv, '.vc').map(function (vc) {
            return { name: own(vc, '.yps'), years: all(vc, '.yp').map(txt) };
          })
        };
      })
    };
  }

  function fromProjects(d) {
    return {
      featured: all(d, '#featured article.case').map(function (a) {
        return {
          id: a.id, title: txt(a.querySelector('.ttl')), one: txt(a.querySelector('.one')),
          meta: txt(a.querySelector('.sw')), award: txt(a.querySelector('.aw')).replace(/^★\s*/, ''),
          tech: all(a, '.tech li').map(rich),
          href: abs('Projects.html#' + a.id)
        };
      }),
      groups: all(d, '#more .theme').map(function (g) {
        return {
          title: txt(g.querySelector('h3')), meta: txt(g.querySelector('.sub')),
          items: all(g, '.rows li').map(function (li) {
            var t = li.querySelector('.t');
            return {
              id: li.id, year: txt(li.querySelector('.y')), title: txt(t), href: abs(t && t.getAttribute('href')),
              one: txt(li.querySelector('.d')).replace(/^·\s*/, ''),
              venue: txt(li.querySelector('.r .v')), award: txt(li.querySelector('.r .aw')).replace(/^★\s*/, '')
            };
          })
        };
      })
    };
  }

  function fromPublications(d, me) {
    var featured = all(d, '#selected article[id]').map(function (a) { return a.id; });
    function list(sec) {
      return all(d, '#' + sec + ' .r').map(function (r) {
        var rv = r.querySelector('.rv'), sub = txt(rv.querySelector('small'));
        var tag = rv.firstChild ? rv.firstChild.textContent.trim() : '';
        var ra = r.querySelector('.ra'), full = ra.querySelector('.au-full');
        var pdf = all(r, '.qls a.ql').filter(function (a) { return txt(a) === 'PDF'; })[0];
        var label = sec === 'papers' ? tag + '’' + sub.slice(-2) : sec === 'patents' ? tag + sub : tag + ' ' + sub;
        return {
          id: (r.id || '').replace(/-row$/, ''), kind: sec, topic: r.dataset.topic, year: +sub.slice(-4) || 0, label: label,
          title: txt(r.querySelector('.rt')), href: abs(pdf ? pdf.getAttribute('href') : rv.getAttribute('href')),
          authors: rich(ra), authorsFull: full ? rich(full) : rich(ra), first: txt(ra).indexOf(me) === 0,
          where: txt(r.querySelector('.rw')), award: txt(r.querySelector('.award'))
        };
      });
    }
    return { featured: featured, papers: list('papers'), patents: list('patents'), theses: list('theses') };
  }

  function fromAwards(d) {
    return all(d, 'details.stage').map(function (s) {
      var items = [];
      all(s, '.tl li').forEach(function (li) {
        var it = { year: txt(li.querySelector('.y')), title: txt(li.querySelector('.w')).replace(/\s*×(\d+) awards$/, ' ×$1'), tag: txt(li.querySelector('.tag')) };
        // The same award in several years becomes one line: "2012, 2013  National Scholarship…"
        var same = items.filter(function (i) { return i.title === it.title; })[0];
        if (same) same.year = it.year + ', ' + same.year; else items.push(it);
      });
      // The page names the org with a logo; data-cv keeps the org in the CV's stage heading.
      var h = s.querySelector('h2');
      return { stage: (h && h.getAttribute('data-cv')) || txt(h), span: txt(s.querySelector('summary .span')), past: s.classList.contains('past'), items: items };
    });
  }

  // ---------- rendering ----------
  function entry(left, body, cls) { return '<div class="e' + (cls ? ' ' + cls : '') + '"><div class="l">' + left + '</div><div class="b">' + body + '</div></div>'; }
  function section(title, inner) { return inner ? '<section><h2>' + esc(title) + '</h2>' + inner + '</section>' : ''; }
  function sub(title) { return '<h3>' + esc(title) + '</h3>'; }
  function note(s) { return s ? '<div class="n">' + esc(s) + '</div>' : ''; }
  var STAR = '<svg class="st" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
  function star(s) { return s ? ' <span class="aw">' + STAR + esc(s) + '</span>' : ''; }
  function isPoster(p) { return /^Poster\b/i.test(p.title); }
  function when(s) { return esc(String(s).replace(/\bnow\b/, 'Present')); }
  function bulletList(items, cls) { return items && items.length ? '<ul class="' + cls + '">' + items.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' : ''; }

  function renderHeader() {
    var h = data.home, siteUrl = location.origin + location.pathname.replace(/[^/]*$/, '');
    var contact = h.contact.map(function (c) { return link(esc(c.text), abs(c.href)); });
    contact.splice(1, 0, link(esc(siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')), siteUrl));
    var stamp = 'Updated ' + new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return '<header class="cv-h"><div class="up">' + esc(stamp) + '</div><h1>' + esc(h.name) + '</h1><div class="hl">' + esc(h.headline) + '</div>' +
      '<div class="ct">' + contact.join('<span class="dot">·</span>') + '</div></header>';
  }

  // Positioning paragraph. The wording is a template; previous role, featured projects, venues and counts
  // are filled from the site so they stay current. The job title is already in the header, so it is not repeated.
  function renderSummary() {
    var h = data.home, pb = data.pubs;
    var prev = ((h.summary[1] || '').match(/^Previously ([^.]*)\./) || [])[1];
    var proj = function (id) { return data.proj.featured.filter(function (p) { return p.id === id; })[0]; };
    var ari = proj('ari'), itb = proj('itbench');
    var venues = TOP_VENUES.filter(function (v) {
      return pb.papers.some(function (p) { return !isPoster(p) && p.label.indexOf(v + '\u2019') === 0; });
    });
    var us = pb.patents.filter(function (p) { return /^US/.test(p.label); }).length;
    var out = 'Builds production <b>AI agents</b> and the evaluation systems that make them trustworthy.';
    if (ari) out += ' Leads ' + link('ARI', ari.href) + ', a multi-agent predictive AI SRE agent, and built a RAG-grounded, claim-level <b>LLM-as-a-judge</b> with <b>98% accuracy</b>.';
    if (prev) out += ' Previously ' + esc(prev) + (itb ? '; co-author of <b>' + link('ITBench', itb.href) + '</b>' + (itb.award ? ' (' + esc(itb.award) + ')' : '') : '') + '.';
    out += ' Ph.D. in Computer Science, ' + pb.papers.length + ' publications' + (venues.length ? ' (' + venues.join(', ') + ')' : '') +
      ', ' + pb.patents.length + ' patents' + (us ? ' (' + us + ' US)' : '') + '.';
    return section('Summary', '<p class="sum">' + out + '</p>');
  }

  function renderExpertise() {
    return section('Skills & expertise', data.home.expertise.map(function (g) {
      return entry(esc(g.label), '<div class="chips">' + g.chips.map(function (c) { return '<span>' + esc(c) + '</span>'; }).join('') + '</div>', 'x');
    }).join(''));
  }

  function renderWork(resume) {
    return section('Experience', data.exp.work.map(function (g) {
      var roles = g.roles.filter(function (r) { return !(resume ? RESUME_SKIP_ROLES : CV_SKIP_ROLES).test(r.title); });
      if (!roles.length) return '';
      return '<div class="job"><div class="org">' + esc(g.org) + '</div>' + roles.map(function (r) { return entry(when(r.dates), '<b>' + esc(r.title) + '</b>'); }).join('') +
        bulletList(g.bullets, 'wb') + '</div>';
    }).join(''));
  }

  function renderEducation(resume) {
    return section('Education', data.exp.education.map(function (e) {
      var parts = e.title.split(' · ');
      return entry(esc(e.dates), '<b>' + esc(parts[0]) + '</b>' + (parts[1] ? ', ' + esc(parts.slice(1).join(' · ')) : '') + (resume ? '' : note(e.note)));
    }).join(''));
  }

  function projectEntry(p, left) {
    return entry(when(left), '<b>' + link(esc(p.title), p.href) + '</b>' + (p.org ? ' <span class="w">· ' + esc(p.org) + '</span>' : '') +
      (p.venue ? ' <span class="v">[' + esc(p.venue) + ']</span>' : '') + star(p.award) + '<div>' + esc(p.one) + '</div>' + bulletList(p.tech, 'tech'));
  }

  // Full CV only: the resume carries this work as Experience bullets.
  function renderProjects() {
    var pr = data.proj;
    var feat = pr.featured.map(function (p) {
      var m = p.meta.split(' · ');
      return projectEntry({ title: p.title, href: p.href, award: p.award, one: p.one, org: m[1] }, m[0]);
    }).join('');
    return section('Projects', sub('Featured') + feat + pr.groups.map(function (g) {
      return sub(g.title + (g.meta ? ' · ' + g.meta : '')) + g.items.map(function (p) { return projectEntry(p, p.year); }).join('');
    }).join(''));
  }

  // Full CV: complete author list and venue details. Resume: venue label, title and award only.
  // Chinese patents list number, title and dates only (their inventor lists run to 12–17 names).
  function pubEntry(p, full) {
    var authors = full && p.kind !== 'theses' && !/^CN/.test(p.label);
    var stop = /[?!.]$/.test(p.title) ? '' : '.';
    return entry('<span class="tag">' + esc(p.label) + '</span>',
      (authors ? p.authorsFull + '. ' : '') + '<b>' + link(esc(p.title), p.href) + '</b>' +
      (full ? stop + ' <span class="w">' + esc(p.where) + '</span>' : '') + star(p.award), 'p');
  }

  function renderPublications(resume) {
    var pb = data.pubs;
    if (resume) {
      // Featured papers first, then award-winning and first-author papers, newest first.
      // Featured, award-winning, LLM-topic and first-author papers (no posters), newest first.
      var pick = pb.papers.filter(function (p) {
        return !isPoster(p) && (pb.featured.indexOf(p.id) >= 0 || p.award || p.topic === 'llm' || (p.first && p.topic !== 'wsn'));
      })
        .sort(function (a, b) { return b.year - a.year; }).slice(0, RESUME_PUBS);
      var siteUrl = abs('Publications.html');
      return section('Selected publications', pick.map(function (p) { return pubEntry(p, false); }).join('') +
        '<p class="more">' + pb.papers.length + ' publications and ' + pb.patents.length + ' patents in total. Full list: ' + link(esc(siteUrl.replace(/^https?:\/\//, '')), siteUrl) + '</p>');
    }
    function block(title, items) { return items.length ? sub(title + ' (' + items.length + ')') + items.map(function (p) { return pubEntry(p, true); }).join('') : ''; }
    return section('Publications', block('Papers and posters', pb.papers) + block('Patents', pb.patents) + block('Theses', pb.theses));
  }

  function renderAwards(resume) {
    if (resume) {
      var items = [];
      data.awards.forEach(function (s) { s.items.forEach(function (i) { if (RESUME_AWARD_TAGS.indexOf(i.tag) >= 0 && !RESUME_AWARD_SKIP.test(i.title)) items.push(i); }); });
      return section('Selected awards', '<div class="cols">' + items.map(function (i) { return '<div><span class="y">' + esc(i.year) + '</span>' + esc(i.title) + '</div>'; }).join('') + '</div>');
    }
    return section('Awards and honors', data.awards.map(function (s) {
      var items = s.past ? s.items.filter(function (i) { return CV_PAST_AWARD_KEEP.test(i.title); }) : s.items;
      return sub(s.stage + (s.span ? ' · ' + s.span : '')) + items.map(function (i) { return entry(esc(i.year), esc(i.title)); }).join('');
    }).join(''));
  }

  function renderRows(title, rows) {
    return section(title, rows.map(function (r) { return entry(esc(r.dates), '<b>' + esc(r.title) + '</b>' + note(r.note)); }).join(''));
  }

  function years(ys) {
    // "2026, 2025, 2024" -> "2024–2026" when consecutive.
    var n = ys.map(Number);
    if (ys.length > 2 && n.every(function (y, i) { return !isNaN(y) && (i === 0 || n[i - 1] - y === 1); })) return n[n.length - 1] + ' – ' + n[0];
    return ys.join(', ').replace(/\bnow\b/, 'Present');
  }

  function renderService(resume) {
    if (resume) {
      // One compact paragraph of venue abbreviations: "Role: VENUE, VENUE · Role: …"
      return section('Professional service', '<p class="svc">' + data.exp.service.map(function (s) {
        return '<span class="nw"><b>' + esc(s.role) + ':</b> ' + s.venues.map(function (v) {
          var m = v.name.match(/\(([^)]+)\)(.*)$/);
          return esc(m ? m[1] + m[2] : v.name);
        }).join(', ') + '</span>';
      }).join(' <span class="dot">·</span> ') + '</p>');
    }
    return section('Academic service', data.exp.service.map(function (s) {
      return entry(esc(s.role), s.venues.map(function (v) { return '<div>' + esc(v.name) + ' <span class="w">' + esc(years(v.years)) + '</span></div>'; }).join(''));
    }).join(''));
  }

  function render() {
    var resume = mode === 'resume';
    sheet.className = 'sheet ' + mode;
    sheet.innerHTML = renderHeader() + renderSummary() + renderExpertise() + (resume
      ? renderWork(true) + renderPublications(true) + renderEducation(true) + renderAwards(true) + renderService(true)
      : renderWork(false) + renderEducation(false) + renderProjects() + renderPublications(false) + renderAwards(false) +
        renderRows('Teaching', data.exp.teaching) + renderRows('Mentoring', data.exp.mentoring) + renderService(false));
    all(document, '[data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.mode === mode)); });
    document.title = data.home.name + ' – ' + (resume ? 'Resume' : 'CV');
    // Name and title on every printed page, next to the page number.
    var foot = document.getElementById('cv-foot') || document.head.appendChild(document.createElement('style'));
    foot.id = 'cv-foot';
    foot.textContent = '@page { @bottom-left { content: "' + (data.home.name + ' · ' + data.home.headline.split(' · ')[0]).replace(/["\\]/g, '') +
      '"; font: 8pt "Plex CV", sans-serif; color: #7a828f; } }';
  }

  function fileName() {
    var d = new Date(), pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return data.home.name.replace(/\s+/g, '_') + '_' + (mode === 'resume' ? 'Resume' : 'CV') + '_' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function download() {
    if (window.track) track('cv_download', { cv_type: mode }, mode);
    // The browser's print engine makes a real text PDF with working links; the title becomes the default file name.
    var t = document.title;
    document.title = fileName();
    // Wait for the self-hosted fonts so they embed as real fonts in the PDF.
    document.fonts.ready.then(function () {
      window.print();
      setTimeout(function () { document.title = t; }, 500);
    });
  }

  // ---------- boot ----------
  all(document, '[data-mode]').forEach(function (b) {
    b.addEventListener('click', function () {
      mode = b.dataset.mode;
      if (window.track) track('cv_mode', { cv_type: mode }, mode);
      params.set('type', mode);
      history.replaceState(null, '', '?' + params.toString());
      if (data) render();
    });
  });
  document.getElementById('cv-dl').addEventListener('click', function () { if (data) download(); });

  var keys = Object.keys(PAGES);
  Promise.all(keys.map(function (k) {
    return fetch(PAGES[k], { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(PAGES[k] + ': HTTP ' + r.status);
      return r.text();
    }).then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); });
  })).then(function (docs) {
    var d = {}; keys.forEach(function (k, i) { d[k] = docs[i]; });
    var home = fromHome(d.home);
    data = {
      home: home, exp: fromExperience(d.exp), proj: fromProjects(d.proj),
      pubs: fromPublications(d.pubs, home.name), awards: fromAwards(d.awards)
    };
    render();
    document.getElementById('cv-dl').disabled = false;
    if (params.has('print')) setTimeout(download, 300);
  }).catch(function (err) {
    sheet.innerHTML = '<p class="err">Could not read the site pages to build the CV (' + esc(err.message) + '). ' +
      'If you opened this file directly from disk, serve the folder instead, e.g. <code>python3 -m http.server</code>.</p>';
  });
})();
