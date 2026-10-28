
    (function () {
      const root = document.getElementById('folding-article');
      if (!root) return;
      let animPlaying = true;
      let fig3Folded = true;
      let showBilingual = true;
      let fig3Timer = null;

      const toggleAnimBtn = document.getElementById('toggleAnimBtn');
      const animBtnText = document.getElementById('animBtnText');
      const animStatusDot = document.getElementById('animStatusDot');
      const toggleLangBtn = document.getElementById('toggleLangBtn');
      const stepFig3Btn = document.getElementById('stepFig3Btn');
      const fig3StateBadge = document.getElementById('fig3StateBadge');

      const col1Before = document.getElementById('col1StateBefore');
      const col1After = document.getElementById('col1StateAfter');
      const col3Before = document.getElementById('col3StateBefore');
      const col3After = document.getElementById('col3StateAfter');

      function renderFig3State() {
        if (fig3Folded) {
          col1Before.setAttribute('opacity', '0');
          col1Before.style.opacity = '0';
          col1After.setAttribute('opacity', '1');
          col1After.style.opacity = '1';

          col3Before.setAttribute('opacity', '0');
          col3Before.style.opacity = '0';
          col3After.setAttribute('opacity', '1');
          col3After.style.opacity = '1';

          fig3StateBadge.textContent = '当前帧：变化后（已合并 / 已折入主循环）';
          fig3StateBadge.className = 'badge-pill';
        } else {
          col1Before.setAttribute('opacity', '1');
          col1Before.style.opacity = '1';
          col1After.setAttribute('opacity', '0');
          col1After.style.opacity = '0';

          col3Before.setAttribute('opacity', '1');
          col3Before.style.opacity = '1';
          col3After.setAttribute('opacity', '0');
          col3After.style.opacity = '0';

          fig3StateBadge.textContent = '当前帧：变化前（4 个独立子智能体 / 未折入）';
          fig3StateBadge.className = 'badge-pill before-mode';
        }
      }

      function startFig3Loop() {
        if (fig3Timer) clearInterval(fig3Timer);
        fig3Timer = setInterval(function () {
          if (animPlaying) {
            fig3Folded = !fig3Folded;
            renderFig3State();
          }
        }, 2800);
      }

      toggleAnimBtn.addEventListener('click', function () {
        animPlaying = !animPlaying;
        const svgList = root.querySelectorAll('svg');

        if (animPlaying) {
          animBtnText.textContent = '动画播放中 (点击暂停)';
          animStatusDot.className = 'status-dot';
          svgList.forEach(function (s) { if (s.unpauseAnimations) s.unpauseAnimations(); });
        } else {
          animBtnText.textContent = '动画已暂停 (点击播放)';
          animStatusDot.className = 'status-dot paused';
          svgList.forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
        }
      });

      stepFig3Btn.addEventListener('click', function () {
        fig3Folded = !fig3Folded;
        renderFig3State();
      });

      toggleLangBtn.addEventListener('click', function () {
        showBilingual = !showBilingual;
        const enElements = root.querySelectorAll('.en-sub');
        enElements.forEach(function (el) {
          el.style.display = showBilingual ? '' : 'none';
        });
        toggleLangBtn.textContent = showBilingual ? '显示：中英双语' : '显示：仅中文';
      });

      renderFig3State();
      startFig3Loop();
    })();
