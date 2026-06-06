// ══════════════════════════════════════════════════════════
//  main.js  —  포트폴리오 공통 스크립트
//  1) 스크롤 진행바
//  2) 맨 위로 버튼
//  3) 타이핑 효과 (index.html 전용)
// ══════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  initScrollProgress();
  initBackToTop();
  initTypingEffect();
});

// ──────────────────────────────────────────────────────────
// 1) 스크롤 진행바
// ──────────────────────────────────────────────────────────
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scroll-progress-bar';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress  = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
}

// ──────────────────────────────────────────────────────────
// 2) 맨 위로 버튼
// ──────────────────────────────────────────────────────────
function initBackToTop() {
  const btn = document.createElement('button');
  btn.id        = 'back-to-top';
  btn.innerHTML = '&#8679;';
  btn.title     = '맨 위로';
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ──────────────────────────────────────────────────────────
// 3) 타이핑 효과 — index.html 전용
//    순서: 이름 → 학교 → 학과 → 학번 (끊김 없이 바로 이어서)
// ──────────────────────────────────────────────────────────
function initTypingEffect() {
  const nameEl = document.querySelector('.profile-name');
  if (!nameEl) return;

  const detailItems = Array.from(
    document.querySelectorAll('.profile-details li')
  ).filter(li => !li.querySelector('a'));

  const targets = [
    nameEl,
    ...detailItems.map(li => li.querySelector('.detail-val'))
  ].filter(Boolean);

  const texts = targets.map(el => el.textContent.trim());
  targets.forEach(el => { el.textContent = ''; });

  const SPEED = 100;

  function typeElement(el, text, onDone) {
    el.style.borderRight = '2px solid #1e293b';
    let i = 0;
    function tick() {
      if (i < text.length) {
        el.textContent += text[i++];
        setTimeout(tick, SPEED);
      } else {
        el.style.borderRight = 'none';
        if (onDone) onDone(); // 딜레이 없이 바로 다음 호출
      }
    }
    tick();
  }

  function runSequence(index) {
    if (index >= targets.length) return;
    typeElement(targets[index], texts[index], () => runSequence(index + 1));
  }

  setTimeout(() => runSequence(0), 400);
}
