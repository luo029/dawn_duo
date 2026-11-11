document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('pure-checkin-style')) {
        const style = document.createElement('style');
        style.id = 'pure-checkin-style';
        style.innerHTML = `
            body.pure-checkin-active #main-wrap { display: none !important; }
            body.pure-checkin-active { overflow: hidden; }
            #pure-checkin-wrapper { position: fixed; inset: 0; z-index: 50; display: none; justify-content: center; align-items: center; flex-direction: row; gap: 100px; flex-wrap: wrap; padding: 20px; user-select: none; overflow: hidden; }
            @media (max-width: 600px) { #pure-checkin-wrapper { flex-direction: column; gap: 70px; } }

            /* ===== 状态背景层：深邃高级，拒绝刺眼光晕 ===== */
            .pure-bg { position: absolute; inset: 0; opacity: 0; transition: opacity 1.5s ease; pointer-events: none; z-index: 0; }
            #pure-checkin-wrapper.state-pending .pure-bg-pending,
            #pure-checkin-wrapper.state-sleeping .pure-bg-sleeping,
            #pure-checkin-wrapper.state-done .pure-bg-done { opacity: 1; }
            .pure-bg-pending { background: var(--pure-bg-pending, transparent); }
            .pure-bg-sleeping { background: var(--pure-bg-sleeping, transparent); }
            .pure-bg-done { background: var(--pure-bg-done, transparent); }

            /* 日常模式：柔和莫兰迪 */
            body.theme-daily { --pure-bg-pending: radial-gradient(circle at 50% 50%, #fef3c7 0%, #fce7f3 100%); --pure-bg-sleeping: radial-gradient(circle at 50% 50%, #e0e7ff 0%, #ede9fe 100%); --pure-bg-done: radial-gradient(circle at 50% 50%, #d1fae5 0%, #ccfbf1 100%); }
            /* 主仆-主人：黑金曜石 */
            body.theme-master { --pure-bg-pending: radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%); --pure-bg-sleeping: radial-gradient(circle at 50% 50%, #111111 0%, #000000 100%); --pure-bg-done: radial-gradient(circle at 50% 50%, #2a2210 0%, #050505 100%); }
            /* 主仆-小狗：深红丝绒 */
            body.theme-doggy { --pure-bg-pending: radial-gradient(circle at 50% 50%, #20080a 0%, #050000 100%); --pure-bg-sleeping: radial-gradient(circle at 50% 50%, #100304 0%, #000000 100%); --pure-bg-done: radial-gradient(circle at 50% 50%, #3b0f17 0%, #080001 100%); }

            #pure-btn-container { position: relative; z-index: 2; display: flex; justify-content: center; align-items: center; gap: 100px; width: 100%; flex-wrap: wrap; }
            .pure-btn { position: relative; width: 170px; height: 170px; border-radius: 50%; border: none; background: transparent; cursor: pointer; display: flex; justify-content: center; align-items: center; font-size: 4.2rem; transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1); outline: none; -webkit-tap-highlight-color: transparent; z-index: 2; }
            .pure-btn:active { transform: scale(0.92); }
            .pure-btn span { filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6)); transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1); pointer-events: none; }
            .pure-btn:hover span { transform: translateY(-4px) scale(1.05); }

            /* 状态呼吸反馈 */
            #pure-checkin-wrapper.state-sleeping .pure-btn { animation: pureBtnSleep 4s ease-in-out infinite; }
            #pure-checkin-wrapper.state-done .pure-btn { animation: pureBtnDone 3s ease-in-out infinite; }
            @keyframes pureBtnSleep { 0%, 100% { opacity: 0.75; } 50% { opacity: 1; } }
            @keyframes pureBtnDone { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }

            /* 日常模式 */
            body.theme-daily .pure-btn { background: rgba(255,255,255,0.85); backdrop-filter: blur(10px); box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15); border: 1px solid rgba(255,255,255,0.9); color: #0284c7; }

            /* 主仆-主人：磨砂黑金，残缺指环旋转 (极简高雅) */
            body.theme-master .pure-btn { background: #0a0a0a; color: #e6c875; border: 1px solid rgba(230, 200, 117, 0.4); box-shadow: inset 0 0 0 1px rgba(0,0,0,1), inset 0 0 20px rgba(230, 200, 117, 0.05), 0 10px 30px rgba(0,0,0,0.9); }
            body.theme-master .pure-btn::before { content: ''; position: absolute; inset: -8px; border-radius: 50%; border: 1px solid transparent; border-top-color: rgba(230, 200, 117, 0.4); border-left-color: rgba(230, 200, 117, 0.4); animation: rotateRing 8s linear infinite; pointer-events: none; }
            body.theme-master .pure-btn:hover { box-shadow: inset 0 0 30px rgba(230, 200, 117, 0.1), 0 10px 30px rgba(0,0,0,0.9); border-color: rgba(230, 200, 117, 0.6); }

            /* 主仆-小狗：深红丝绒，荆棘刻度旋转 (隐秘束缚) */
            body.theme-doggy .pure-btn { background: #120204; color: #ff5c7a; border: 1px solid rgba(255, 92, 122, 0.3); box-shadow: inset 0 0 0 1px rgba(0,0,0,1), inset 0 0 30px rgba(255, 92, 122, 0.08), 0 10px 30px rgba(0,0,0,0.9); }
            body.theme-doggy .pure-btn::before { content: ''; position: absolute; inset: -6px; border-radius: 50%; background: repeating-conic-gradient(from 0deg, transparent 0deg 10deg, rgba(255, 92, 122, 0.3) 10deg 12deg); -webkit-mask: radial-gradient(transparent 65%, #000 67%); animation: rotateSpikes 24s linear infinite; pointer-events: none; }
            body.theme-doggy .pure-btn:hover { box-shadow: inset 0 0 40px rgba(255, 92, 122, 0.15), 0 10px 30px rgba(0,0,0,0.9); border-color: rgba(255, 92, 122, 0.6); }

            @keyframes rotateRing { 100% { transform: rotate(360deg); } }
            @keyframes rotateSpikes { 100% { transform: rotate(360deg); } }

            /* 极简锁退出按钮 (高质感毛玻璃) */
            #pure-exit-btn { position: fixed; top: 20px; right: 20px; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); cursor: pointer; font-size: 1.1rem; opacity: 0.6; transition: all 0.3s; display: flex; justify-content: center; align-items: center; z-index: 51; border: 1px solid rgba(255,255,255,0.15); color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
            #pure-exit-btn:hover { opacity: 1; background: rgba(255, 255, 255, 0.2); transform: scale(1.05); border-color: rgba(255,255,255,0.3); }

            /* 统一美化弹窗 */
            #pure-exit-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 200; display: none; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.3s; }
            #pure-exit-modal.show { display: flex; opacity: 1; }
            .pure-modal-box { border-radius: 24px; padding: 30px; text-align: center; width: 320px; transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
            #pure-exit-modal.show .pure-modal-box { transform: translateY(0); }
            .pure-modal-title { font-size: 1.3rem; font-weight: 900; margin-bottom: 24px; letter-spacing: 2px; }
            .pure-modal-actions { display: flex; gap: 12px; }
            .pure-modal-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-size: 0.95rem; font-weight: bold; cursor: pointer; transition: all 0.2s; }

            body.theme-daily .pure-modal-box { background: #fff; box-shadow: 0 20px 50px rgba(56, 189, 248, 0.3); }
            body.theme-daily .pure-modal-title { color: #0284c7; }
            body.theme-daily .pure-modal-btn.cancel { background: #f0f9ff; color: #0284c7; }
            body.theme-daily .pure-modal-btn.confirm { background: linear-gradient(135deg, #38bdf8, #0ea5e9); color: #fff; }

            body.theme-master .pure-modal-box { background: #111; border: 2px solid #d4af37; box-shadow: 0 20px 50px rgba(212, 175, 55, 0.2); }
            body.theme-master .pure-modal-title { color: #d4af37; }
            body.theme-master .pure-modal-btn.cancel { background: #222; color: #888; }
            body.theme-master .pure-modal-btn.confirm { background: #d4af37; color: #000; }

            body.theme-doggy .pure-modal-box { background: linear-gradient(135deg, #140c0f, #0a0507); border: 2px solid #3b1018; box-shadow: 0 20px 50px rgba(0,0,0,0.8), inset 0 0 20px rgba(255,42,85,0.1); }
            body.theme-doggy .pure-modal-title { color: #ff2a55; text-shadow: 0 0 10px rgba(255,42,85,0.5); }
            body.theme-doggy .pure-modal-btn.cancel { background: #1a1316; color: #a19ead; border: 1px solid #3b1018; }
            body.theme-doggy .pure-modal-btn.confirm { background: linear-gradient(135deg, #ff2a55, #b91c1c); color: #fff; box-shadow: 0 4px 15px rgba(255,42,85,0.4); }
        `;
        document.head.appendChild(style);
    }

    const wrap = document.createElement('div');
    wrap.id = 'pure-checkin-wrapper';
    wrap.innerHTML = `
        <div class="pure-bg pure-bg-pending"></div>
        <div class="pure-bg pure-bg-sleeping"></div>
        <div class="pure-bg pure-bg-done"></div>
        <button id="pure-exit-btn" title="退出模式">🔒</button>
        <div id="pure-btn-container"></div>
        <div id="pure-exit-modal">
            <div class="pure-modal-box">
                <div class="pure-modal-title">解除契约？</div>
                <div class="pure-modal-actions">
                    <button class="pure-modal-btn cancel" onclick="closePureExitModal()">取消</button>
                    <button class="pure-modal-btn confirm" onclick="confirmPureExit()">确定退出</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(wrap);

    window.openPureExitModal = () => { document.getElementById('pure-exit-modal').classList.add('show'); };
    window.closePureExitModal = () => { document.getElementById('pure-exit-modal').classList.remove('show'); };
    window.confirmPureExit = () => {
        localStorage.setItem('dawn-duo-checkin-mode', 'false');
        closePureExitModal();
        applyPureMode();
        if (window.showToast) window.showToast('已解除打卡模式。', 'success');
    };

    document.getElementById('pure-exit-btn').onclick = window.openPureExitModal;

    function applyPureMode() {
        const isPure = localStorage.getItem('dawn-duo-checkin-mode') === 'true';
        if (isPure) {
            document.body.classList.add('pure-checkin-active');
            wrap.style.display = 'flex';
            updatePureUI();
        } else {
            document.body.classList.remove('pure-checkin-active', 'theme-daily', 'theme-master', 'theme-doggy');
            wrap.classList.remove('state-pending', 'state-sleeping', 'state-done');
            wrap.style.display = 'none';
        }
    }

    function updatePureUI() {
        if (localStorage.getItem('dawn-duo-checkin-mode') !== 'true') return;
        const container = document.getElementById('pure-btn-container');
        if (!container) return;

        let mode = 'service';
        try {
            const c = JSON.parse(localStorage.getItem('dawn-duo-configs'));
            if (c && c.mode) mode = c.mode;
        } catch(e) {}

        const currentIdentity = localStorage.getItem('dawn-duo-identity') || 'master';

        let localDb = { master: {}, doggy: {} };
        try {
            const d = JSON.parse(localStorage.getItem('dawn-duo-data'));
            if (d) localDb = d;
        } catch(e) {}

        const today = window.getLogicalDateStr ? window.getLogicalDateStr() : new Date().toISOString().split('T')[0];
        const users = (currentIdentity === 'master' || currentIdentity === 'doggy') ? [currentIdentity] : ['master', 'doggy'];

        document.body.classList.remove('theme-daily', 'theme-master', 'theme-doggy');
        if (mode === 'daily') {
            document.body.classList.add('theme-daily');
        } else {
            document.body.classList.add(currentIdentity === 'doggy' ? 'theme-doggy' : 'theme-master');
        }

        let stateIdx = 2;
        users.forEach(u => {
            const rec = localDb[u]?.[today] || {};
            let s = 0;
            if (rec.sleep && rec.sleep.done) s = (rec.wake && rec.wake.done) ? 2 : 1;
            if (s < stateIdx) stateIdx = s;
        });
        const stateName = ['pending', 'sleeping', 'done'][stateIdx];
        wrap.classList.remove('state-pending', 'state-sleeping', 'state-done');
        wrap.classList.add('state-' + stateName);

        container.innerHTML = '';
        users.forEach(u => {
            const rec = localDb[u]?.[today] || {};
            const isMaster = u === 'master';
            let type, icon;
            
            if (mode === 'daily') {
                if (!rec.sleep || !rec.sleep.done) { type = 'sleep'; icon = '💤'; }
                else if (!rec.wake || !rec.wake.done) { type = 'wake'; icon = '☀️'; }
                else { type = 'sleep'; icon = '🌙'; }
            } else {
                // 主仆模式：回归绳索与锁链，主人用王冠
                if (!rec.sleep || !rec.sleep.done) { 
                    type = 'sleep'; 
                    icon = isMaster ? '👑' : '🪢'; 
                } else if (!rec.wake || !rec.wake.done) { 
                    type = 'wake'; 
                    icon = isMaster ? '☀️' : '⛓️'; 
                } else { 
                    type = 'sleep'; 
                    icon = isMaster ? '👑' : '🐾'; 
                }
            }

            const btn = document.createElement('button');
            btn.className = 'pure-btn';
            btn.innerHTML = `<span>${icon}</span>`;
            btn.onclick = () => { if (window.toggle) window.toggle(u, type); };

            let pressTimer;
            btn.onpointerdown = () => { pressTimer = setTimeout(() => window.openPureExitModal(), 1500); };
            btn.onpointerup = () => { clearTimeout(pressTimer); };
            btn.onpointerleave = () => { clearTimeout(pressTimer); };

            container.appendChild(btn);
        });
    }

    if (window.render) {
        const originalRender = window.render;
        window.render = function() {
            originalRender.apply(this, arguments);
            updatePureUI();
        };
    }

    if (window.openSettings) {
        const originalOpen = window.openSettings;
        window.openSettings = function() {
            originalOpen.apply(this, arguments);
            const tabGeneral = document.getElementById('tab-general');
            if (tabGeneral && !document.getElementById('cfg-checkin-mode-wrap')) {
                const div = document.createElement('div');
                div.className = 'config-card';
                div.id = 'cfg-checkin-mode-wrap';
                div.innerHTML = `<div class="config-title">🎯 契约打卡模式</div><div class="switch-row"><label>开启全屏极简打卡</label><label class="toggle-switch"><input type="checkbox" id="cfg-checkin-mode"><span class="slider"></span></label></div><div class="mode-tip">隐蔽所有界面，呈现不同主题的专属打卡按钮。背景色会随打卡状态自动变换。</div>`;
                tabGeneral.insertBefore(div, tabGeneral.firstElementChild);

                const chk = document.getElementById('cfg-checkin-mode');
                chk.onchange = (e) => {
                    localStorage.setItem('dawn-duo-checkin-mode', e.target.checked ? 'true' : 'false');
                    applyPureMode();
                };
            }
            const chk = document.getElementById('cfg-checkin-mode');
            if (chk) chk.checked = localStorage.getItem('dawn-duo-checkin-mode') === 'true';
        };
    }

    applyPureMode();
});