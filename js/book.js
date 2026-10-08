(function(){
  const pages    = Array.from(document.querySelectorAll('.page'));
  const book     = document.getElementById('book');
  const btnPrev  = document.getElementById('prev');
  const btnNext  = document.getElementById('next');
  const counter  = document.getElementById('counter');
  const musicBtn = document.getElementById('musicBtn');
  const total    = pages.length;

  let current = 0;
  let locked  = false;

  pages.forEach(page => {
    page.querySelectorAll('.reveal').forEach(el => {
      if(el.dataset.split) return;
      const words = el.textContent.trim().split(/\s+/);
      el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
      el.dataset.split = '1';
    });
  });

  function showPage(index){
    if(index < 0 || index >= total) return;
    if(locked) return;
    locked = true;

    const prev = pages[current];
    const next = pages[index];

    if(prev && prev !== next){
      prev.classList.remove('active');
      prev.classList.add('leaving');
      setTimeout(() => prev.classList.remove('leaving'), 900);
    }

    next.classList.add('active');
    current = index;
    counter.textContent = `${current + 1} / ${total}`;

    next.querySelectorAll('.reveal').forEach((el, pi) => {
      const words = el.querySelectorAll('.w');
      words.forEach((w, i) => {
        w.style.animation = 'none';
        void w.offsetWidth;
        w.style.animation = 'wordIn .65s ease forwards';
        w.style.animationDelay = `${(pi * 0.5) + (i * 0.045)}s`;
      });
    });

    const chordIndex = parseInt(next.dataset.chord || '0', 10);
    if(window.Audio7){
      window.Audio7.pageSound();
      setTimeout(() => window.Audio7.playChord(chordIndex), 300);
      if(next.dataset.heartbeat === '1'){
        setTimeout(() => window.Audio7.heartbeat(), 900);
        setTimeout(() => window.Audio7.heartbeat(), 2100);
      }
    }

    setTimeout(() => { locked = false; }, 700);
  }

  function nextPage(){ if(current < total - 1) showPage(current + 1); }
  function prevPage(){ if(current > 0) showPage(current - 1); }

  btnNext.addEventListener('click', e => { e.stopPropagation(); nextPage(); });
  btnPrev.addEventListener('click', e => { e.stopPropagation(); prevPage(); });

  book.addEventListener('click', e => {
    const r = book.getBoundingClientRect();
    (e.clientX > r.left + r.width / 2) ? nextPage() : prevPage();
  });

  document.addEventListener('keydown', e => {
    if(e.key === 'ArrowRight' || e.key === ' ') nextPage();
    if(e.key === 'ArrowLeft')  prevPage();
  });

  let tx = 0, ty = 0;
  book.addEventListener('touchstart', e => {
    tx = e.touches[0].clientX;
    ty = e.touches[0].clientY;
  }, {passive:true});
  book.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if(Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 45){
      dx < 0 ? nextPage() : prevPage();
    }
  }, {passive:true});

  musicBtn.addEventListener('click', e => {
    e.stopPropagation();
    if(!window.Audio7) return;
    if(window.Audio7.isOn()){
      window.Audio7.off();
      musicBtn.classList.remove('on');
      musicBtn.textContent = '♪';
    } else {
      window.Audio7.on();
      musicBtn.classList.add('on');
      musicBtn.textContent = '♫';
      const chordIndex = parseInt(pages[current].dataset.chord || '0', 10);
      setTimeout(() => window.Audio7.playChord(chordIndex), 900);
    }
  });

  showPage(0);
})();
