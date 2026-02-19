(function(){
  const root = document.documentElement;

  // Tema
  const themeBtn = document.getElementById('toggleTheme');
  const savedTheme = localStorage.getItem('libertyTheme');
  if(savedTheme) root.setAttribute('data-theme', savedTheme);

  function toggleTheme(){
    const current = root.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('libertyTheme', next);
  }
  if(themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Print/PDF
  const printBtn = document.getElementById('printBtn');
  if(printBtn) printBtn.addEventListener('click', () => window.print());

  // Nav ativo
  const path = location.pathname.replace(/\\/g,'/').toLowerCase();
  document.querySelectorAll('.navItem[data-path]').forEach(a=>{
    const p = a.getAttribute('data-path').toLowerCase();
    if(path.endsWith(p)) a.classList.add('active');
  });

  // TOC automático (pega h2/h3 dentro de .article)
  const toc = document.getElementById('toc');
  const article = document.querySelector('.article');
  if(toc && article){
    const heads = Array.from(article.querySelectorAll('h2, h3'));
    const links = [];
    heads.forEach(h=>{
      if(!h.id){
        const slug = h.textContent.trim().toLowerCase()
          .replace(/[^\p{L}\p{N}\s-]/gu,'')
          .replace(/\s+/g,'-')
          .slice(0, 64);
        h.id = slug || ('sec-' + Math.random().toString(16).slice(2));
      }
      links.push({ id: h.id, text: h.textContent, level: h.tagName });
    });

    toc.innerHTML = '';
    links.forEach(l=>{
      const a = document.createElement('a');
      a.href = `#${l.id}`;
      a.textContent = (l.level === 'H3' ? '↳ ' : '') + l.text;
      toc.appendChild(a);
    });
  }

  // Busca (filtra cards/sections)
  const search = document.getElementById('search');
  const cards = Array.from(document.querySelectorAll('section.card'));
  const details = Array.from(document.querySelectorAll('details'));

  function clearHighlights(){
    document.querySelectorAll('mark').forEach(m=>{
      m.replaceWith(document.createTextNode(m.textContent));
    });
    document.querySelectorAll('.hit').forEach(el=>el.classList.remove('hit'));
  }

  function highlightText(node, query){
    if(!query) return;
    const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    const texts = [];
    while(walk.nextNode()) texts.push(walk.currentNode);

    texts.forEach(textNode=>{
      const text = textNode.nodeValue;
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      if(idx === -1) return;

      const before = text.slice(0, idx);
      const match = text.slice(idx, idx + query.length);
      const after  = text.slice(idx + query.length);

      const frag = document.createDocumentFragment();
      if(before) frag.appendChild(document.createTextNode(before));
      const mark = document.createElement('mark');
      mark.textContent = match;
      frag.appendChild(mark);
      if(after) frag.appendChild(document.createTextNode(after));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function filterByQuery(q){
    clearHighlights();
    const query = (q || '').trim().toLowerCase();

    if(!query){
      cards.forEach(c=>c.style.display='');
      details.forEach(d=>d.open=false);
      return;
    }
    cards.forEach(card=>{
      const hit = card.innerText.toLowerCase().includes(query);
      card.style.display = hit ? '' : 'none';
      if(hit){
        card.classList.add('hit');
        highlightText(card, query);
        card.querySelectorAll('details').forEach(d=>{
          d.open = d.innerText.toLowerCase().includes(query);
        });
      }
    });
  }

  if(search){
    search.addEventListener('input', () => filterByQuery(search.value));
    window.addEventListener('keydown', (e)=>{
      if(e.key === '/' && document.activeElement !== search){
        e.preventDefault(); search.focus();
      }
      if(e.key === 'Escape'){
        search.value = ''; filterByQuery(''); search.blur();
      }
      if(e.key.toLowerCase() === 't' && document.activeElement !== search) toggleTheme();
    });
  }

  // Storage helpers para cadastros/ranking
  window.LibertyStore = {
    get(key, fallback){
      try{
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      }catch{ return fallback; }
    },
    set(key, value){
      localStorage.setItem(key, JSON.stringify(value));
    },
    download(filename, obj){
      const blob = new Blob([JSON.stringify(obj, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  };
})();
