document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('pure-checkin-style')) { const style = document.createElement('style'); style.id = 'pure-checkin-style'; style.innerHTML = `
    body.pure-checkin-active #main-wrap{display:none!important} body.pure-checkin-active{overflow:hidden}
    #pure-checkin-wrapper{position:fixed;inset:0;z-index:50;display:none;justify-content:center;align-items:center;flex-direction:row;gap:120px;flex-wrap:wrap;padding:20px;user-select:none;overflow:hidden}
    @media(max-width:768px){#pure-checkin-wrapper{flex-direction:column;gap:80px}}
    .pure-bg{position:absolute;inset:0;opacity:0;transition:opacity 1s ease;pointer-events:none;z-index:0}
    #pure-checkin-wrapper.state-pending .pure-bg-pending,#pure-checkin-wrapper.state-sleeping .pure-bg-sleeping,#pure-checkin-wrapper.state-done .pure-bg-done{opacity:1}
    .pure-bg-pending{background:var(--pure-bg-pending,transparent)} .pure-bg-sleeping{background:var(--pure-bg-sleeping,transparent)} .pure-bg-done{background:var(--pure-bg-done,transparent)}
    body.theme-daily{--pure-bg-pending:radial-gradient(circle at 50% 50%,#fcf6f9 0%,#ede9fe 100%);--pure-bg-sleeping:radial-gradient(circle at 50% 50%,#f0fdf4 0%,#e0e7ff 100%);--pure-bg-done:radial-gradient(circle at 50% 50%,#fffbeb 0%,#fce7f3 100%)}
    body.theme-master{--pure-bg-pending:radial-gradient(circle at 50% 50%,#1c1c1c 0%,#070707 100%);--pure-bg-sleeping:radial-gradient(circle at 50% 50%,#0f0f0f 0%,#000 100%);--pure-bg-done:radial-gradient(circle at 50% 50%,#2a2313 0%,#050505 100%)}
    body.theme-doggy{--pure-bg-pending:radial-gradient(circle at 50% 50%,#2a080d 0%,#080203 100%);--pure-bg-sleeping:radial-gradient(circle at 50% 50%,#150304 0%,#000 100%);--pure-bg-done:radial-gradient(circle at 50% 50%,#40101a 0%,#0a0202 100%)}
    #pure-btn-container{position:relative;z-index:2;display:flex;justify-content:center;align-items:center;gap:120px;width:100%;flex-wrap:wrap}
    @media(max-width:768px){#pure-btn-container{gap:60px}}
    .pure-btn{position:relative;width:clamp(140px,40vw,170px);height:clamp(140px,40vw,170px);border-radius:50%;border:none;background:transparent;cursor:pointer;display:flex;justify-content:center;align-items:center;font-size:clamp(3rem,8vw,4.2rem);transition:all .5s cubic-bezier(.2,.8,.2,1);outline:none;-webkit-tap-highlight-color:transparent;z-index:2}
    .pure-btn:active{transform:scale(.92)} .pure-btn span{filter:drop-shadow(0 4px 12px rgba(0,0,0,.5));transition:transform .5s cubic-bezier(.2,.8,.2,1);pointer-events:none} .pure-btn:hover span{transform:translateY(-5px) scale(1.05)}
    #pure-checkin-wrapper.state-sleeping .pure-btn{animation:pureBtnSleep 4s ease-in-out infinite} #pure-checkin-wrapper.state-done .pure-btn{animation:pureBtnDone 3s ease-in-out infinite}
    @keyframes pureBtnSleep{0%,100%{opacity:.8}50%{opacity:1}} @keyframes pureBtnDone{0%,100%{filter:brightness(1)}50%{filter:brightness(1.12)}}
    body.theme-daily .pure-btn{background:rgba(255,255,255,.9);backdrop-filter:blur(10px);box-shadow:0 10px 30px rgba(0,0,0,.05);border:1px solid rgba(255,255,255,1);color:#0284c7}
    body.theme-master .pure-btn{background:#0a0a0a;color:#cfa670;border:1px solid rgba(207,166,112,.35);box-shadow:inset 0 0 0 1px #000,inset 0 0 20px rgba(207,166,112,.05),0 15px 35px rgba(0,0,0,.8)}
    body.theme-master .pure-btn::before{content:'';position:absolute;inset:-10px;border-radius:50%;border:1px solid transparent;border-top-color:rgba(207,166,112,.4);border-left-color:rgba(207,166,112,.1);animation:rotateRing 10s linear infinite;pointer-events:none}
    body.theme-master .pure-btn:hover{box-shadow:inset 0 0 30px rgba(207,166,112,.1),0 15px 35px rgba(0,0,0,.8);border-color:rgba(207,166,112,.7)}
    body.theme-doggy .pure-btn{background:#140305;color:#d90429;border:1px solid rgba(217,4,41,.3);box-shadow:inset 0 0 0 1px #000,inset 0 0 30px rgba(217,4,41,.08),0 15px 35px rgba(0,0,0,.8)}
    body.theme-doggy .pure-btn::before{content:'';position:absolute;inset:-8px;border-radius:50%;background:repeating-conic-gradient(from 0deg,transparent 0deg 12deg,rgba(217,4,41,.25) 12deg 14deg);-webkit-mask:radial-gradient(transparent 65%,#000 67%);animation:rotateSpikes 24s linear infinite;pointer-events:none}
    body.theme-doggy .pure-btn:hover{box-shadow:inset 0 0 40px rgba(217,4,41,.15),0 15px 35px rgba(0,0,0,.8);border-color:rgba(217,4,41,.7)}
    @keyframes rotateRing{100%{transform:rotate(360deg)}} @keyframes rotateSpikes{100%{transform:rotate(360deg)}}
    #pure-exit-btn{position:fixed;top:20px;right:20px;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.08);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);cursor:pointer;font-size:1.1rem;opacity:.6;transition:all .3s;display:flex;justify-content:center;align-items:center;z-index:51;border:1px solid rgba(255,255,255,.1);color:#fff;box-shadow:0 4px 15px rgba(0,0,0,.2)}
    #pure-exit-btn:hover{opacity:1;background:rgba(255,255,255,.15);transform:scale(1.05)}
    #pure-exit-modal{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px);z-index:200;display:none;justify-content:center;align-items:center;opacity:0;transition:opacity .3s}
    #pure-exit-modal.show{display:flex;opacity:1}
    .pure-modal-box{border-radius:24px;padding:36px 28px;text-align:center;width:85%;max-width:340px;transform:translateY(20px);transition:transform .4s cubic-bezier(.175,.885,.32,1.275)}
    #pure-exit-modal.show .pure-modal-box{transform:translateY(0)}
    .pure-modal-title{font-size:1.15rem;font-weight:800;margin-bottom:28px;letter-spacing:1px;line-height:1.6}
    .pure-modal-actions{display:flex;gap:12px}
    .pure-modal-btn{flex:1;padding:14px;border-radius:14px;border:none;font-size:.95rem;font-weight:700;cursor:pointer;transition:all .2s;letter-spacing:1px}
    body.theme-daily .pure-modal-box{background:rgba(255,255,255,.95);box-shadow:0 20px 50px rgba(0,0,0,.1)} body.theme-daily .pure-modal-title{color:#1e293b} body.theme-daily .pure-modal-btn.cancel{background:#f1f5f9;color:#64748b} body.theme-daily .pure-modal-btn.confirm{background:#0ea5e9;color:#fff}
    body.theme-master .pure-modal-box{background:#0a0a0a;border:1px solid rgba(207,166,112,.3);box-shadow:0 20px 60px rgba(0,0,0,.9)} body.theme-master .pure-modal-title{color:#cfa670} body.theme-master .pure-modal-btn.cancel{background:#1a1a1a;color:#888} body.theme-master .pure-modal-btn.confirm{background:#cfa670;color:#000}
    body.theme-doggy .pure-modal-box{background:linear-gradient(135deg,#1c080d,#0a0203);border:1px solid rgba(244,162,182,.15);box-shadow:0 20px 60px rgba(0,0,0,.9),inset 0 0 30px rgba(244,162,182,.03)}
    body.theme-doggy .pure-modal-title{color:#f4a2b6;font-weight:600;letter-spacing:2px;text-shadow:0 2px 10px rgba(0,0,0,.5)}
    body.theme-doggy .pure-modal-btn.cancel{background:#2a0f16;color:#f4a2b6;border:1px solid rgba(244,162,182,.15)} body.theme-doggy .pure-modal-btn.confirm{background:linear-gradient(135deg,#b3475c,#702b3a);color:#fff;box-shadow:0 4px 15px rgba(0,0,0,.4)}
    `; document.head.appendChild(style); }

    const wrap = document.createElement('div'); wrap.id = 'pure-checkin-wrapper';
    wrap.innerHTML = `<div class="pure-bg pure-bg-pending"></div><div class="pure-bg pure-bg-sleeping"></div><div class="pure-bg pure-bg-done"></div><button id="pure-exit-btn" title="退出模式">🔒</button><div id="pure-btn-container"></div><div id="pure-exit-modal"><div class="pure-modal-box"><div class="pure-modal-title" id="pure-modal-title-text">解除契约？</div><div class="pure-modal-actions"><button class="pure-modal-btn cancel" id="pure-modal-btn-cancel" onclick="closePureExitModal()">取消</button><button class="pure-modal-btn confirm" id="pure-modal-btn-confirm" onclick="confirmPureExit()">确定退出</button></div></div></div>`;
    document.body.appendChild(wrap);

    window.openPureExitModal = () => { 
        const titleEl = document.getElementById('pure-modal-title-text'), cancelEl = document.getElementById('pure-modal-btn-cancel'), confirmEl = document.getElementById('pure-modal-btn-confirm');
        let mode = 'service'; try { const c = JSON.parse(localStorage.getItem('dawn-duo-configs')); if (c && c.mode) mode = c.mode; } catch(e) {}
        const currentIdentity = localStorage.getItem('dawn-duo-identity') || 'master';
        if (mode === 'service') {
            if (currentIdentity === 'doggy') { 
                titleEl.innerHTML = '狗狗要偷偷摘下项圈吗？<br><span style="font-size:0.75rem;opacity:0.6;font-weight:normal;letter-spacing:1px;">不听话的坏狗狗，可是会被主人惩罚的哦...</span>'; 
                cancelEl.textContent = '乖乖伸舌'; confirmEl.textContent = '叛逆摘下'; 
            } else { 
                titleEl.innerHTML = '确认解除契约？<br><span style="font-size:0.75rem;opacity:0.6;font-weight:normal;">上位者的规则不容轻易打破。</span>'; 
                cancelEl.textContent = '继续掌控'; confirmEl.textContent = '解除契约'; 
            }
        } else { 
            titleEl.innerHTML = '关闭打卡模式？<br><span style="font-size:0.75rem;opacity:0.6;font-weight:normal;">回到普通的日常界面</span>'; 
            cancelEl.textContent = '取消'; confirmEl.textContent = '确定关闭'; 
        }
        document.getElementById('pure-exit-modal').classList.add('show'); 
    };
    window.closePureExitModal = () => document.getElementById('pure-exit-modal').classList.remove('show');
    window.confirmPureExit = () => { localStorage.setItem('dawn-duo-checkin-mode', 'false'); closePureExitModal(); applyPureMode(); if (window.showToast) window.showToast('已解除打卡模式。', 'success'); };
    document.getElementById('pure-exit-btn').onclick = window.openPureExitModal;

    function applyPureMode() {
        const isPure = localStorage.getItem('dawn-duo-checkin-mode') === 'true';
        if (isPure) { document.body.classList.add('pure-checkin-active'); wrap.style.display = 'flex'; updatePureUI(); } 
        else { document.body.classList.remove('pure-checkin-active', 'theme-daily', 'theme-master', 'theme-doggy'); wrap.classList.remove('state-pending', 'state-sleeping', 'state-done'); wrap.style.display = 'none'; }
    }

    function updatePureUI() {
        if (localStorage.getItem('dawn-duo-checkin-mode') !== 'true') return;
        const container = document.getElementById('pure-btn-container'); if (!container) return;
        let mode = 'service'; try { const c = JSON.parse(localStorage.getItem('dawn-duo-configs')); if (c && c.mode) mode = c.mode; } catch(e) {}
        const currentIdentity = localStorage.getItem('dawn-duo-identity') || 'master';
        let localDb = { master: {}, doggy: {} }; try { const d = JSON.parse(localStorage.getItem('dawn-duo-data')); if (d) localDb = d; } catch(e) {}
        const today = window.getLogicalDateStr ? window.getLogicalDateStr() : new Date().toISOString().split('T')[0];
        const users = (currentIdentity === 'master' || currentIdentity === 'doggy') ? [currentIdentity] : ['master', 'doggy'];

        document.body.classList.remove('theme-daily', 'theme-master', 'theme-doggy');
        if (mode === 'daily') document.body.classList.add('theme-daily'); else document.body.classList.add(currentIdentity === 'doggy' ? 'theme-doggy' : 'theme-master');

        let stateIdx = 2;
        users.forEach(u => { const rec = localDb[u]?.[today] || {}; let s = 0; if (rec.sleep && rec.sleep.done) s = (rec.wake && rec.wake.done) ? 2 : 1; if (s < stateIdx) stateIdx = s; });
        wrap.classList.remove('state-pending', 'state-sleeping', 'state-done'); wrap.classList.add('state-' + ['pending', 'sleeping', 'done'][stateIdx]);

        container.innerHTML = '';
        users.forEach(u => {
            const rec = localDb[u]?.[today] || {}, isMaster = u === 'master', s = !rec.sleep || !rec.sleep.done, w = !rec.wake || !rec.wake.done;
            const type = s ? 'sleep' : (w ? 'wake' : 'sleep');
            const icon = mode === 'daily' ? (s ? '💤' : (w ? '☀️' : '🌙')) : (s ? (isMaster ? '👑' : '🪢') : (w ? (isMaster ? '☀️' : '⛓️') : (isMaster ? '👑' : '🐾')));
            
            const btn = document.createElement('button'); btn.className = 'pure-btn'; btn.innerHTML = `<span>${icon}</span>`; 
            btn.onclick = () => { 
                if (btn.disabled) return; btn.disabled = true; setTimeout(() => btn.disabled = false, 1000);
                if (window.toggle) window.toggle(u, type); 
            };
            let pressTimer; btn.onpointerdown = () => { pressTimer = setTimeout(() => window.openPureExitModal(), 1500); }; btn.onpointerup = () => { clearTimeout(pressTimer); }; btn.onpointerleave = () => { clearTimeout(pressTimer); };
            container.appendChild(btn);
        });
    }

    if (window.render) { const originalRender = window.render; window.render = function() { originalRender.apply(this, arguments); updatePureUI(); }; }

    if (window.openSettings) {
        const originalOpen = window.openSettings;
        window.openSettings = function() {
            originalOpen.apply(this, arguments);
            const tabGeneral = document.getElementById('tab-general');
            if (tabGeneral && !document.getElementById('cfg-checkin-mode-wrap')) {
                const div = document.createElement('div'); div.className = 'config-card'; div.id = 'cfg-checkin-mode-wrap';
                div.innerHTML = `<div class="config-title">🎯 契约打卡模式</div><div class="switch-row"><label>开启全屏极简打卡</label><label class="toggle-switch"><input type="checkbox" id="cfg-checkin-mode"><span class="slider"></span></label></div><div class="mode-tip">隐蔽所有界面，呈现不同主题的专属打卡按钮。背景色会随打卡状态自动变换。</div>`;
                tabGeneral.insertBefore(div, tabGeneral.firstElementChild);
                const chk = document.getElementById('cfg-checkin-mode'); 
                chk.onchange = (e) => { 
                    localStorage.setItem('dawn-duo-checkin-mode', e.target.checked ? 'true' : 'false'); 
                    applyPureMode(); 
                    // 核心修复：开启后立刻强制关闭设置面板
                    if (e.target.checked && window.closeSettings) window.closeSettings(); 
                };
            }
            const chk = document.getElementById('cfg-checkin-mode'); if (chk) chk.checked = localStorage.getItem('dawn-duo-checkin-mode') === 'true';
        };
    }
    applyPureMode();
});