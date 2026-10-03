// FAQ accordion for roughcut.com.au. Plain JS, no dependencies.
// Each answer is a `collapse-box` (the app's utility: grid-rows 0fr -> 1fr, opacity, and a
// visibility hand-off so closed answers are not reachable). The question is a <button> with
// aria-expanded / aria-controls, the same contract as the header menu (nav.js). With JS off,
// site.css shows every answer open, so nothing is ever unreachable.
(function () {
  var toggles = document.querySelectorAll('[data-faq-toggle]');
  for (var i = 0; i < toggles.length; i++) {
    (function (toggle) {
      var box = document.getElementById(toggle.getAttribute('aria-controls'));
      var inner = box && box.firstElementChild;
      if (!box || !inner) return;

      function setOpen(open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) box.dataset.open = '';
        else delete box.dataset.open;
        if (open) inner.removeAttribute('inert');
        else inner.setAttribute('inert', '');
      }

      setOpen(false);
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
    })(toggles[i]);
  }
})();
