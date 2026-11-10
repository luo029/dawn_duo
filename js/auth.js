window.verifyAndUnlock = async function() {
  const tokenInput = document.getElementById('setup-token'), btn = document.getElementById('setup-btn'), progressArea = document.getElementById('setup-progress-area'), progressBar = document.getElementById('setup-progress-bar'), progressText = document.getElementById('setup-progress-text');
  const token = tokenInput.value.trim(); if (!token) return showToast('小狗不乖哦，口令不能空着~', 'late');
  tokenInput.disabled = true; btn.disabled = true; btn.textContent = '正在献上忠诚...'; progressArea.classList.add('show'); progressBar.classList.remove('error'); progressBar.style.width = '10%'; progressText.classList.remove('error'); progressText.textContent = '正在核对主人的印记...';
  try {
    const res = await fetch(`https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}`, { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' } });
    if (!res.ok) throw new Error('Token无效或无权限');
    progressBar.style.width = '40%'; progressText.textContent = '主人已确认，正在解开小狗的项圈...';
    setTimeout(() => {
      progressBar.style.width = '80%'; progressText.textContent = '正在同步专属调教记录...';
      setTimeout(() => {
        progressBar.style.width = '100%'; progressText.textContent = '🐾 项圈已解开，欢迎回来，我的小狗。';
        ghConfig.token = token; localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig));
        identity = 'doggy'; localStorage.setItem('dawn-duo-identity', 'doggy');
        configs.mode = 'service'; localStorage.setItem('dawn-duo-configs', JSON.stringify(configs));
        setTimeout(() => {
          const setupOverlay = document.getElementById('setup-overlay'); if (setupOverlay) { setupOverlay.classList.add('hide'); setTimeout(() => { setupOverlay.style.display = 'none'; }, 500); }
          const identityModal = document.getElementById('identity-modal'); if (identityModal) identityModal.classList.remove('show'); document.body.style.overflow = '';
          document.getElementById('main-wrap').style.display = 'block'; applyConfigsToPage(); updateModeCards(); applyIdentity(); render(); autoPullOnLoad();
        }, 1200);
      }, 1000);
    }, 1000);
  } catch (err) {
    progressBar.classList.add('error'); progressBar.style.width = '100%'; progressText.classList.add('error'); progressText.textContent = '❌ 口令错误，小狗可是要被惩罚的哦。';
    setTimeout(() => { tokenInput.disabled = false; btn.disabled = false; btn.textContent = '重新向主人献上忠诚'; progressBar.style.width = '0%'; }, 2500);
  }
};
window.clearToken = function() { if (!confirm('解除绑定后，将无法同步数据，确定吗？')) return; ghConfig.token = ''; localStorage.setItem(CONFIG_KEY, JSON.stringify(ghConfig)); closeSettings(); location.reload(); };
function initIdentity() {
  if (!identity) { identity = 'doggy'; try { localStorage.setItem(IDENTITY_KEY, 'doggy'); } catch(e) {} }
  updateIdentityLabels(); updateIdentityCards();
  const identityModal = document.getElementById('identity-modal'); if (identityModal) identityModal.classList.remove('show'); document.body.style.overflow = '';
  if (!ghConfig.token) { document.getElementById('setup-overlay').classList.add('show'); document.getElementById('main-wrap').style.display = 'none'; } 
  else { const overlay = document.getElementById('setup-overlay'); if (overlay) overlay.style.display = 'none'; document.getElementById('main-wrap').style.display = 'block'; applyIdentity(); }
}