(function () {
  const root = document.getElementById('folding-article');
  if (!root) return;
  const before = ['col1StateBefore', 'col3StateBefore'].map(id => root.querySelector('#' + id));
  const after = ['col1StateAfter', 'col3StateAfter'].map(id => root.querySelector('#' + id));
  if ([...before, ...after].some(el => !el)) return;
  let folded = true;
  function render() {
    before.forEach(el => {
      el.setAttribute('opacity', folded ? '0' : '1');
      el.style.opacity = folded ? '0' : '1';
    });
    after.forEach(el => {
      el.setAttribute('opacity', folded ? '1' : '0');
      el.style.opacity = folded ? '1' : '0';
    });
  }
  render();
  window.setInterval(function () {
    folded = !folded;
    render();
  }, 2800);
})();
