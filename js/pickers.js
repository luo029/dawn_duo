document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .tp-overlay, .dp-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: none; justify-content: center; align-items: center; }
        .tp-overlay.show, .dp-overlay.show { display: flex; }
        .tp-box { background: var(--card-bg); border-radius: 20px; width: 280px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
        .tp-header { padding: 16px; text-align: center; font-weight: bold; border-bottom: 1px solid var(--border); background: var(--settings-bg); color: var(--text); }
        .tp-body { display: flex; height: 200px; position: relative; overflow: hidden; background: var(--card-bg); }
        .tp-col { flex: 1; overflow-y: scroll; padding: 80px 0; text-align: center; scrollbar-width: none; -webkit-overflow-scrolling: touch; will-change: scroll-position; }
        .tp-col::-webkit-scrollbar { display: none; }
        .tp-item { height: 40px; line-height: 40px; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; transition: color 0.1s, font-size 0.1s; font-family: 'DIN Alternate', monospace; }
        .tp-item.active { color: var(--tab-active); font-weight: bold; font-size: 1.4rem; }
        .tp-colon { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); font-size: 1.5rem; font-weight: bold; color: var(--text); pointer-events: none; z-index: 2; }
        .tp-highlight { position: absolute; top: 80px; left: 10%; right: 10%; height: 40px; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); pointer-events: none; background: rgba(56, 189, 248, 0.05); border-radius: 8px; z-index: 1; }
        .tp-footer { display: flex; border-top: 1px solid var(--border); position: relative; z-index: 3; background: var(--card-bg); }
        .tp-btn { flex: 1; padding: 16px; border: none; background: transparent; font-size: 1rem; cursor: pointer; color: var(--text); font-weight: 600; }
        .tp-btn.confirm { color: var(--tab-active); border-left: 1px solid var(--border); }

        .dp-box { background: var(--card-bg); border-radius: 20px; width: 320px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2); display: flex; flex-direction: column; }
        .dp-header { padding: 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); background: var(--settings-bg); }
        .dp-title { font-weight: bold; font-size: 1.05rem; color: var(--text); display: flex; gap: 8px; align-items: center; }
        .dp-nav { background: transparent; border: none; font-size: 1.2rem; color: var(--text-muted); cursor: pointer; padding: 4px 8px; border-radius: 6px; transition: background 0.2s; }
        .dp-nav:hover { background: var(--btn-bg); color: var(--text); }
        .dp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; padding: 12px 16px 4px; font-size: 0.75rem; color: var(--text-muted); font-weight: 700; }
        .dp-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 8px 16px; }
        .dp-cell { height: 36px; display: flex; justify-content: center; align-items: center; font-size: 0.9rem; border-radius: 8px; cursor: pointer; color: var(--text); transition: all 0.2s; font-family: 'DIN Alternate', sans-serif; }
        .dp-cell:hover { background: var(--btn-bg); }
        .dp-cell.other-month { color: var(--text-muted); opacity: 0.5; }
        .dp-cell.today { color: var(--tab-active); font-weight: bold; border: 1px solid rgba(56, 189, 248, 0.3); }
        .dp-cell.selected { background: var(--tab-active); color: #fff; font-weight: bold; box-shadow: 0 2px 8px rgba(56, 189, 248, 0.4); }
        .dp-footer { display: flex; border-top: 1px solid var(--border); padding: 12px 16px; justify-content: flex-end; background: var(--card-bg); }
        .dp-btn-today { background: var(--btn-bg); border: 1px solid var(--border); color: var(--text); padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .dp-btn-today:hover { border-color: var(--tab-active); color: var(--tab-active); }
    `;
    document.head.appendChild(style);

    const tpOverlay = document.createElement('div');
    tpOverlay.className = 'tp-overlay';
    tpOverlay.innerHTML = `<div class="tp-box">
        <div class="tp-header">选择时间</div>
        <div class="tp-body">
            <div class="tp-highlight"></div>
            <div class="tp-col" id="tp-col-hour"></div>
            <div class="tp-colon">:</div>
            <div class="tp-col" id="tp-col-min"></div>
        </div>
        <div class="tp-footer">
            <button class="tp-btn" onclick="closeTimePicker()">取消</button>
            <button class="tp-btn confirm" onclick="confirmTimePicker()">确定</button>
        </div>
    </div>`;
    document.body.appendChild(tpOverlay);

    const hourCol = document.getElementById('tp-col-hour');
    const minCol = document.getElementById('tp-col-min');
    let currentTimeInput = null;

    for(let i=0; i<24; i++) {
        const el = document.createElement('div');
        el.className = 'tp-item'; el.textContent = String(i).padStart(2, '0'); el.dataset.val = i;
        el.onclick = () => { hourCol.scrollTo({ top: i * 40, behavior: 'smooth' }); };
        hourCol.appendChild(el);
    }
    for(let i=0; i<60; i++) {
        const el = document.createElement('div');
        el.className = 'tp-item'; el.textContent = String(i).padStart(2, '0'); el.dataset.val = i;
        el.onclick = () => { minCol.scrollTo({ top: i * 40, behavior: 'smooth' }); };
        minCol.appendChild(el);
    }

    function updateActiveTime(col) {
        const index = Math.round(col.scrollTop / 40);
        if (col.lastIndex === index) return;
        col.lastIndex = index;
        Array.from(col.children).forEach((el, i) => {
            if (i === index) el.classList.add('active'); else el.classList.remove('active');
        });
    }

    let rafH, rafM, timerH, timerM;
    hourCol.addEventListener('scroll', () => {
        if (!rafH) { rafH = requestAnimationFrame(() => { updateActiveTime(hourCol); rafH = null; }); }
        clearTimeout(timerH);
        timerH = setTimeout(() => {
            const idx = Math.round(hourCol.scrollTop / 40);
            if (hourCol.scrollTop !== idx * 40) hourCol.scrollTo({ top: idx * 40, behavior: 'smooth' });
        }, 150);
    }, { passive: true });

    minCol.addEventListener('scroll', () => {
        if (!rafM) { rafM = requestAnimationFrame(() => { updateActiveTime(minCol); rafM = null; }); }
        clearTimeout(timerM);
        timerM = setTimeout(() => {
            const idx = Math.round(minCol.scrollTop / 40);
            if (minCol.scrollTop !== idx * 40) minCol.scrollTo({ top: idx * 40, behavior: 'smooth' });
        }, 150);
    }, { passive: true });

    window.openTimePicker = function(inputEl) {
        currentTimeInput = inputEl;
        let parts = (inputEl.value || '12:00').split(':');
        let h = parseInt(parts[0]) || 0, m = parseInt(parts[1]) || 0;
        tpOverlay.classList.add('show');
        setTimeout(() => {
            hourCol.style.scrollBehavior = 'auto'; minCol.style.scrollBehavior = 'auto';
            hourCol.scrollTop = h * 40; minCol.scrollTop = m * 40;
            void hourCol.offsetHeight;
            hourCol.style.scrollBehavior = ''; minCol.style.scrollBehavior = '';
            hourCol.lastIndex = -1; minCol.lastIndex = -1;
            updateActiveTime(hourCol); updateActiveTime(minCol);
        }, 20);
    };
    window.closeTimePicker = function() { tpOverlay.classList.remove('show'); currentTimeInput = null; };
    window.confirmTimePicker = function() {
        if (currentTimeInput) {
            const h = Math.round(hourCol.scrollTop / 40), m = Math.round(minCol.scrollTop / 40);
            currentTimeInput.value = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            currentTimeInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        closeTimePicker();
    };

    const dpOverlay = document.createElement('div');
    dpOverlay.className = 'dp-overlay';
    dpOverlay.innerHTML = `<div class="dp-box">
        <div class="dp-header">
            <button class="dp-nav" id="dp-prev">◀</button>
            <div class="dp-title" id="dp-title">2026年 11月</div>
            <button class="dp-nav" id="dp-next">▶</button>
        </div>
        <div class="dp-weekdays">
            <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div class="dp-days" id="dp-days"></div>
        <div class="dp-footer">
            <button class="dp-btn-today" onclick="selectToday()">回到今天</button>
        </div>
    </div>`;
    document.body.appendChild(dpOverlay);

    let currentDateInput = null;
    let currentViewYear, currentViewMonth;
    let selectedDateStr = '';

    function renderCalendar() {
        document.getElementById('dp-title').textContent = `${currentViewYear}年 ${currentViewMonth + 1}月`;
        const daysContainer = document.getElementById('dp-days');
        daysContainer.innerHTML = '';
        
        const firstDay = new Date(currentViewYear, currentViewMonth, 1).getDay();
        const daysInMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentViewYear, currentViewMonth, 0).getDate();

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const el = document.createElement('div');
            el.className = 'dp-cell other-month'; el.textContent = d;
            daysContainer.appendChild(el);
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const dStr = `${currentViewYear}-${String(currentViewMonth+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
            const el = document.createElement('div');
            el.className = 'dp-cell'; el.textContent = i;
            if (dStr === todayStr) el.classList.add('today');
            if (dStr === selectedDateStr) el.classList.add('selected');
            el.onclick = () => {
                selectedDateStr = dStr;
                if (currentDateInput) {
                    currentDateInput.value = dStr;
                    currentDateInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
                dpOverlay.classList.remove('show');
            };
            daysContainer.appendChild(el);
        }
        const totalCells = firstDay + daysInMonth;
        const nextMonthCells = totalCells <= 35 ? 35 - totalCells : 42 - totalCells;
        for (let i = 1; i <= nextMonthCells; i++) {
            const el = document.createElement('div');
            el.className = 'dp-cell other-month'; el.textContent = i;
            daysContainer.appendChild(el);
        }
    }

    document.getElementById('dp-prev').onclick = () => {
        currentViewMonth--;
        if (currentViewMonth < 0) { currentViewMonth = 11; currentViewYear--; }
        renderCalendar();
    };
    document.getElementById('dp-next').onclick = () => {
        currentViewMonth++;
        if (currentViewMonth > 11) { currentViewMonth = 0; currentViewYear++; }
        renderCalendar();
    };

    window.selectToday = function() {
        const today = new Date();
        selectedDateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
        if (currentDateInput) {
            currentDateInput.value = selectedDateStr;
            currentDateInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        dpOverlay.classList.remove('show');
    };

    window.openDatePicker = function(inputEl) {
        currentDateInput = inputEl;
        let val = inputEl.value;
        if (!val) {
            const now = new Date();
            val = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        }
        selectedDateStr = val;
        const parts = val.split('-');
        currentViewYear = parseInt(parts[0]);
        currentViewMonth = parseInt(parts[1]) - 1;
        renderCalendar();
        dpOverlay.classList.add('show');
    };

    dpOverlay.onclick = (e) => { if (e.target === dpOverlay) dpOverlay.classList.remove('show'); };
    tpOverlay.onclick = (e) => { if (e.target === tpOverlay) tpOverlay.classList.remove('show'); };

    function bindInputs() {
        document.querySelectorAll('input[type="time"]').forEach(input => {
            if (input.dataset.tpBound) return;
            input.dataset.tpBound = 'true';
            input.style.pointerEvents = 'none'; 
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative'; wrapper.style.width = '100%';
            input.parentNode.insertBefore(wrapper, input); wrapper.appendChild(input);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; background:transparent; border:none; cursor:pointer;';
            btn.onclick = (e) => { e.preventDefault(); openTimePicker(input); };
            wrapper.appendChild(btn);
        });
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (input.dataset.dpBound) return;
            input.dataset.dpBound = 'true';
            input.style.pointerEvents = 'none'; 
            const wrapper = document.createElement('div');
            wrapper.style.position = 'relative'; wrapper.style.width = '100%';
            input.parentNode.insertBefore(wrapper, input); wrapper.appendChild(input);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; background:transparent; border:none; cursor:pointer;';
            btn.onclick = (e) => { e.preventDefault(); openDatePicker(input); };
            wrapper.appendChild(btn);
        });
    }

    const observer = new MutationObserver(() => bindInputs());
    observer.observe(document.body, { childList: true, subtree: true });
    bindInputs();
});