// Header behaviour for roughcut.com.au. Plain JS, no dependencies.
// Mirrors components/Header.tsx: the mobile menu is a `collapse-box` that stays in the DOM,
// toggled by a button with aria-expanded / aria-controls; its inner wrapper is `inert` while
// closed so Tab cannot reach it during the close animation; Escape closes it and returns focus;
// choosing a link closes it. With JS off, site.css shows the menu open and hides the button.
(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var box = toggle && document.getElementById(toggle.getAttribute('aria-controls'));
  var inner = box && box.firstElementChild;
  if (!toggle || !box || !inner) return;

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) box.dataset.open = '';
    else delete box.dataset.open;
    box.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) inner.removeAttribute('inert');
    else inner.setAttribute('inert', '');
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  setOpen(false);

  toggle.addEventListener('click', function () { setOpen(!isOpen()); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  box.addEventListener('click', function (e) {
    if (e.target.closest('a')) setOpen(false);
  });

  // Active link underline: the app marks the current route with aria-current="page"
  // (components/Header.tsx); here the current page is whichever [data-tab] href matches.
  var path = location.pathname.replace(/index\.html$/, '');
  var tabs = document.querySelectorAll('.site-header [data-tab]');
  for (var i = 0; i < tabs.length; i++) {
    var href = tabs[i].getAttribute('href');
    if (!href) continue;
    var u = new URL(href, location.href);
    // A section anchor is not "the current page" (both / and /#how-it-works resolve to /).
    if (u.hash) continue;
    if (u.origin === location.origin && u.pathname.replace(/index\.html$/, '') === path) {
      tabs[i].setAttribute('aria-current', 'page');
    }
  }
})();
