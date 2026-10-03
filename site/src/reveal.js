// Scroll reveal for roughcut.com.au. Plain JS, no dependencies.
// Mirrors components/Reveal.tsx rule for rule; html[data-js] stands in for html[data-hydrated].
//
//   - Without JS nothing is ever hidden: site.css only hides `.reveal` under html[data-js],
//     and the first statement below is what sets it.
//   - Anything already on screen (or above it) at init is shown at once with data-instant: no fade.
//   - Only items below the fold wait, and each animates in once (CSS `fade-up`, --reveal-delay).
//   - Entering from above (scrolling back up), or 3+ items in one observer callback (a fast
//     scroll), shows instantly with no stagger; and anything still hidden above the viewport
//     is revealed, so a jump, End or Back never leaves a blank band.
//   - --reveal-delay = min(data-index, 8) * 60ms, same cap as the app.
//   - Reduced motion and print are CSS policy (generated into site.css from the app).
(function () {
  document.documentElement.dataset.js = '';

  var MAX_STAGGER_ITEMS = 8;
  var STEP_MS = 60;
  var FAST_SCROLL_BATCH = 3;

  var items = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  var observer = null;

  function show(el, instant) {
    el.dataset.inview = '';
    if (instant) el.dataset.instant = '';
    if (observer) observer.unobserve(el);
  }

  /** Anything still unrevealed that sits above the viewport is shown at once (jump, Back, End). */
  function revealEverythingAbove() {
    var hidden = document.querySelectorAll('.reveal:not([data-inview])');
    for (var i = 0; i < hidden.length; i++) {
      if (hidden[i].getBoundingClientRect().bottom < 0) show(hidden[i], true);
    }
  }

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      function (entries) {
        var incoming = entries.filter(function (e) { return e.isIntersecting; });
        var fast = incoming.length >= FAST_SCROLL_BATCH;
        var cameFromAbove = false;
        for (var i = 0; i < incoming.length; i++) {
          var fromAbove = incoming[i].boundingClientRect.top < 0;
          cameFromAbove = cameFromAbove || fromAbove;
          show(incoming[i].target, fromAbove || fast);
        }
        if (cameFromAbove) revealEverythingAbove();
      },
      // Any part of the item entering the viewport reveals it: nothing on screen stays hidden.
      { rootMargin: '0px', threshold: 0 }
    );
  }

  items.forEach(function (el) {
    var index = parseInt(el.dataset.index || '0', 10) || 0;
    var delay = Math.min(index, MAX_STAGGER_ITEMS) * STEP_MS;
    if (delay) el.style.setProperty('--reveal-delay', delay + 'ms');

    var onScreenOrAbove = el.getBoundingClientRect().top < window.innerHeight;
    if (onScreenOrAbove || !observer) show(el, true);
    else observer.observe(el);
  });

  // Back/forward cache restores and in-page jumps land anywhere; sweep what is now above.
  window.addEventListener('pageshow', revealEverythingAbove);
  window.addEventListener('hashchange', revealEverythingAbove);
})();
