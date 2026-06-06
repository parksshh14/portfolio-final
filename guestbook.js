// ── Guestbook JS ──────────────────────────────────────────
// localStorage를 이용해 댓글과 좋아요를 저장합니다.

const STORAGE_KEY = 'portfolio_guestbook';

// ── 데이터 불러오기 / 저장 ─────────────────────────────────
function loadEntries() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

// ── 날짜 포맷 ──────────────────────────────────────────────
function formatDate(isoString) {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  const hh   = String(d.getHours()).padStart(2, '0');
  const min  = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

// ── 카드 렌더링 ────────────────────────────────────────────
function renderEntries() {
  const entries = loadEntries();
  const list    = document.getElementById('gb-list');
  const empty   = document.getElementById('gb-empty');
  const countEl = document.getElementById('gb-count');

  countEl.textContent = entries.length;

  if (entries.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }

  empty.style.display = 'none';

  // 최신순 정렬
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));

  list.innerHTML = sorted.map(entry => `
    <div class="gb-card" data-id="${entry.id}">
      <div class="gb-card-header">
        <div class="gb-card-meta">
          <span class="gb-card-name">${escapeHtml(entry.name)}</span>
          <span class="gb-card-date">${formatDate(entry.date)}</span>
        </div>
        <div class="gb-card-actions">
          <button
            class="gb-like-btn ${entry.liked ? 'liked' : ''}"
            onclick="toggleLike('${entry.id}')"
            title="좋아요"
          >
            <span class="gb-heart">${entry.liked ? '❤️' : '🤍'}</span>
            <span class="gb-like-count">${entry.likes}</span>
          </button>
          <button
            class="gb-delete-btn"
            onclick="openDeleteModal('${entry.id}')"
            title="삭제"
          >🗑️</button>
        </div>
      </div>
      <p class="gb-card-message">${escapeHtml(entry.message)}</p>
    </div>
  `).join('');
}

// ── XSS 방지 ───────────────────────────────────────────────
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── 댓글 작성 ──────────────────────────────────────────────
function submitEntry() {
  const nameEl    = document.getElementById('gb-name');
  const pwEl      = document.getElementById('gb-password');
  const msgEl     = document.getElementById('gb-message');
  const submitBtn = document.getElementById('gb-submit');

  const name    = nameEl.value.trim();
  const pw      = pwEl.value.trim();
  const message = msgEl.value.trim();

  // 유효성 검사
  if (!name) {
    shake(nameEl);
    nameEl.focus();
    return;
  }
  if (!pw) {
    shake(pwEl);
    pwEl.focus();
    return;
  }
  if (!message) {
    shake(msgEl);
    msgEl.focus();
    return;
  }

  const entries = loadEntries();

  const newEntry = {
    id:      Date.now().toString(),
    name,
    pw,          // 실제 서비스라면 해시 처리 필요
    message,
    date:    new Date().toISOString(),
    likes:   0,
    liked:   false, // 현재 브라우저에서 좋아요 눌렀는지
  };

  entries.push(newEntry);
  saveEntries(entries);

  // 입력창 초기화
  nameEl.value    = '';
  pwEl.value      = '';
  msgEl.value     = '';
  document.getElementById('gb-char-count').textContent = '0 / 200';

  // 버튼 피드백
  submitBtn.textContent = '✅ 작성 완료!';
  submitBtn.disabled    = true;
  setTimeout(() => {
    submitBtn.textContent = '작성하기';
    submitBtn.disabled    = false;
  }, 1500);

  renderEntries();
}

// ── 좋아요 토글 ────────────────────────────────────────────
function toggleLike(id) {
  const entries = loadEntries();
  const entry   = entries.find(e => e.id === id);
  if (!entry) return;

  if (entry.liked) {
    entry.likes = Math.max(0, entry.likes - 1);
    entry.liked = false;
  } else {
    entry.likes += 1;
    entry.liked = true;
  }

  saveEntries(entries);
  renderEntries();
}

// ── 삭제 모달 ──────────────────────────────────────────────
let deleteTargetId = null;

function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('gb-modal-pw').value = '';
  document.getElementById('gb-modal').style.display = 'flex';
  document.getElementById('gb-modal-pw').focus();
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('gb-modal').style.display = 'none';
}

function confirmDelete() {
  const pw      = document.getElementById('gb-modal-pw').value;
  const entries = loadEntries();
  const entry   = entries.find(e => e.id === deleteTargetId);

  if (!entry) { closeDeleteModal(); return; }

  if (entry.pw !== pw) {
    shake(document.getElementById('gb-modal-pw'));
    document.getElementById('gb-modal-pw').value = '';
    document.getElementById('gb-modal-pw').placeholder = '비밀번호가 틀렸습니다!';
    setTimeout(() => {
      document.getElementById('gb-modal-pw').placeholder = '비밀번호 입력';
    }, 1500);
    return;
  }

  const updated = entries.filter(e => e.id !== deleteTargetId);
  saveEntries(updated);
  closeDeleteModal();
  renderEntries();
}

// ── 흔들기 애니메이션 (입력 오류 시) ──────────────────────
function shake(el) {
  el.classList.remove('gb-shake');
  void el.offsetWidth; // reflow 강제
  el.classList.add('gb-shake');
  el.addEventListener('animationend', () => el.classList.remove('gb-shake'), { once: true });
}

// ── 이벤트 바인딩 ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderEntries();

  // 작성 버튼
  document.getElementById('gb-submit').addEventListener('click', submitEntry);

  // textarea Enter(Ctrl+Enter)로 제출
  document.getElementById('gb-message').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) submitEntry();
  });

  // 글자 수 카운터
  document.getElementById('gb-message').addEventListener('input', (e) => {
    const len = e.target.value.length;
    document.getElementById('gb-char-count').textContent = `${len} / 200`;
  });

  // 모달 버튼
  document.getElementById('gb-modal-cancel').addEventListener('click', closeDeleteModal);
  document.getElementById('gb-modal-confirm').addEventListener('click', confirmDelete);

  // 모달 비밀번호 Enter
  document.getElementById('gb-modal-pw').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmDelete();
  });

  // 모달 배경 클릭 시 닫기
  document.getElementById('gb-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('gb-modal')) closeDeleteModal();
  });
});
