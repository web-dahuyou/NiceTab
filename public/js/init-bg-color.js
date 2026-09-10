(function () {
  try {
    var t = localStorage.getItem('nicetab-theme-type');
    var dark =
      t === 'dark' ||
      (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);

    if (dark) {
      var el = document.documentElement;
      el.style.setProperty('--bg-color', '#2f2f2f');
      el.style.backgroundColor = '#2f2f2f';
    }
  } catch (e) {}
})();
