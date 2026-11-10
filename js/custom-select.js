window.refreshCustomSelects = function() {
  document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
    const select = wrapper.querySelector('select'), trigger = wrapper.querySelector('.custom-select-trigger'), optionsList = wrapper.querySelector('.custom-select-options');
    if (!select || !trigger || !optionsList) return;
    if (optionsList.children.length !== select.options.length) renderOptions(select, optionsList, trigger);
    else { trigger.textContent = select.options[select.selectedIndex]?.text || ''; Array.from(optionsList.children).forEach((optEl, idx) => { optEl.classList.toggle('selected', idx === select.selectedIndex); }); }
  });
};
function renderOptions(select, optionsList, trigger) {
  optionsList.innerHTML = '';
  Array.from(select.options).forEach((opt, index) => {
    const optionDiv = document.createElement('div'); optionDiv.className = 'custom-select-option'; if (index === select.selectedIndex) optionDiv.classList.add('selected'); optionDiv.textContent = opt.text; optionDiv.dataset.value = opt.value;
    optionDiv.addEventListener('click', (e) => {
      e.stopPropagation(); select.selectedIndex = index; trigger.textContent = opt.text; Array.from(optionsList.children).forEach(el => el.classList.remove('selected')); optionDiv.classList.add('selected');
      const wrapper = select.closest('.custom-select-wrapper'); if (wrapper) wrapper.classList.remove('open'); select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    optionsList.appendChild(optionDiv);
  });
  trigger.textContent = select.options[select.selectedIndex]?.text || '';
}
function initCustomSelects() {
  document.querySelectorAll('select').forEach(select => {
    if (select.nextElementSibling && select.nextElementSibling.classList.contains('custom-select-wrapper')) return; if (select.dataset.customized === 'true') return;
    select.dataset.customized = 'true';
    const wrapper = document.createElement('div'); wrapper.className = 'custom-select-wrapper'; select.parentNode.insertBefore(wrapper, select); wrapper.appendChild(select);
    const trigger = document.createElement('div'); trigger.className = 'custom-select-trigger'; trigger.tabIndex = 0;
    const optionsList = document.createElement('div'); optionsList.className = 'custom-select-options';
    renderOptions(select, optionsList, trigger); wrapper.appendChild(trigger); wrapper.appendChild(optionsList);
    trigger.addEventListener('click', (e) => {
      e.stopPropagation(); document.querySelectorAll('.custom-select-wrapper.open').forEach(w => { if (w !== wrapper) w.classList.remove('open'); });
      const rect = wrapper.getBoundingClientRect(); const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 220 && rect.top > 220) wrapper.classList.add('drop-up'); else wrapper.classList.remove('drop-up');
      wrapper.classList.toggle('open');
    });
  });
  if (!window.hasCustomSelectListener) { document.addEventListener('click', () => { document.querySelectorAll('.custom-select-wrapper.open').forEach(w => w.classList.remove('open')); }); window.hasCustomSelectListener = true; }
}
window.addEventListener('DOMContentLoaded', initCustomSelects);