<!-- ======= TEXT_BEAUTY_V3 LITE (UI/CSS somente) ======= -->
<style id="TEXT_BEAUTY_V3_LITE">
:root{
  --tb-txt-card: color-mix(in oklab, var(--bg-panel, #0a0a0c) 90%, black);
  --tb-txt-bd: color-mix(in oklab, var(--text-main, #e5e7eb) 14%, transparent);
  --tb-chip-bg: linear-gradient(42deg, var(--neon-cyan, #00f2ff), var(--neon-purple, #bd00ff));
  --tb-chip-ink: #000;
  --tb-paren-ink: color-mix(in oklab, var(--text-main, #e5e7eb) 92%, white);
}

/* texto em blocos de resposta */
.response-block p{
  text-wrap: pretty;
  line-height: 1.6;
  letter-spacing: .01em;
  margin: .6rem 0;
  hyphens: auto;
}

/* parênteses realce */
.tb-span-paren{
  padding: .05rem .35rem;
  border-radius: .45rem;
  border: 1px solid var(--tb-txt-bd);
  color: var(--tb-paren-ink);
  background: color-mix(in oklab, var(--tb-txt-card) 86%, transparent);
}

/* chip simples */
.tb-chip, .tb-chip-btn{
  display:inline-grid; place-items:center;
  padding:.22rem .5rem; border-radius:999px;
  background: var(--tb-chip-bg); color: var(--tb-chip-ink);
  font-weight:700; letter-spacing:.02em; cursor:pointer; user-select:none;
}

/* badge copiar lista */
.tb-copy-badge{
  position:absolute; top:.45rem; right:.45rem;
  font-size:.78rem; padding:.2rem .45rem; border-radius:999px;
  background: color-mix(in oklab, #fff 12%, var(--tb-txt-card));
  border: 1px solid var(--tb-txt-bd);
  color: var(--text-main); opacity:.9; transition:.18s; user-select:none;
  cursor:pointer;
}

/* botao copiar código no <pre> */
.tb-copy-code{
  position:absolute; top:8px; right:10px; z-index:6;
  font-size:.78rem; padding:.28rem .5rem; border-radius:8px;
  background:rgba(0,0,0,0.55); color:#fff; border:1px solid rgba(255,255,255,0.06);
  cursor:pointer;
}

/* raw html container visual */
.tb-raw-html {
  background: var(--tb-txt-card); border: 1px dashed var(--tb-txt-bd);
  border-radius: 10px; padding: .7rem; margin: .6rem 0;
}
.tb-raw-html .tb-raw-note{ color: color-mix(in oklab, var(--text-main) 62%, transparent); font-size:.9em; margin-bottom:.35rem; }
</style>

<script id="TEXT_BEAUTY_V3_LITE_SCRIPT">
(function(){
  if(window.__DUAL_TEXT_BEAUTY_V3_LITE_LOADED__) return;
  window.__DUAL_TEXT_BEAUTY_V3_LITE_LOADED__ = true;

  // copia com feedback (pequeno utilitário)
  async function _copyWithFeedback(text, btn){
    try{
      await navigator.clipboard.writeText(String(text||''));
      const prev = btn.innerText;
      btn.innerText = 'Copiado!';
      setTimeout(()=> btn.innerText = prev, 1200);
      return true;
    }catch(e){
      console.warn('[TB-LITE] copy fail', e);
      return false;
    }
  }

  // adiciona botão "Copiar Código" em <pre> dentro de .response-block
  function beautifyPre(root=document){
    (root || document).querySelectorAll('.response-block pre').forEach(pre=>{
      if(pre.dataset.tb_lite_pre) return;
      // wrapper position
      if(getComputedStyle(pre).position === 'static') pre.style.position = 'relative';
      const btn = document.createElement('button');
      btn.className = 'tb-copy-code';
      btn.type = 'button';
      btn.innerText = 'Copiar Código';
      btn.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const code = pre.querySelector('code') ? pre.querySelector('code').innerText : pre.innerText;
        _copyWithFeedback(code, btn);
      });
      pre.appendChild(btn);
      pre.dataset.tb_lite_pre = '1';
    });
  }

  // adiciona badge "Copiar Lista" para <ul> e <ol> dentro de .response-block
  function enableListCopy(root=document){
    (root || document).querySelectorAll('.response-block ul, .response-block ol').forEach(list=>{
      if(list.dataset.tb_lite_list) return;
      // wrap parent to allow absolute badge
      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      list.parentNode.insertBefore(wrapper, list);
      wrapper.appendChild(list);
      const badge = document.createElement('button');
      badge.className = 'tb-copy-badge';
      badge.type = 'button';
      badge.innerText = 'Copiar Lista';
      badge.addEventListener('click', (ev)=>{
        ev.stopPropagation();
        const txt = Array.from(list.querySelectorAll('li')).map(li => li.innerText.trim()).join('\n');
        _copyWithFeedback(txt, badge);
      });
      wrapper.appendChild(badge);
      list.dataset.tb_lite_list = '1';
    });
  }

  // renderiza data-raw de forma sanitizada (usa DOMPurify se disponível)
  function renderRawHTML(root=document){
    (root || document).querySelectorAll('.response-block[data-raw]').forEach(block=>{
      if(block.dataset.tb_lite_raw) return;
      const raw = block.dataset.raw || '';
      if(!raw) { block.dataset.tb_lite_raw = '1'; return; }
      if(/<\s*(div|img|p|table|section|iframe|svg)/i.test(raw)){
        try{
          let safe = raw;
          if(window.DOMPurify && typeof DOMPurify.sanitize === 'function'){
            safe = DOMPurify.sanitize(raw, {ADD_ATTR: ['allow','allowfullscreen','loading']});
          }
          const tmp = document.createElement('div');
          tmp.innerHTML = safe;
          const wrapper = document.createElement('div');
          wrapper.className = 'tb-raw-html';
          wrapper.innerHTML = '<div class="tb-raw-note">Conteúdo HTML renderizado</div>';
          wrapper.appendChild(tmp);
          block.innerHTML = ''; // substitui conteúdo interno
          block.appendChild(wrapper);
        }catch(e){
          console.warn('[TB-LITE] renderRawHTML error', e);
        }
      }
      block.dataset.tb_lite_raw = '1';
    });
  }

  // principal: roda todas as transformações
  function runAll(rootSelector){
    const root = rootSelector ? document.querySelector(rootSelector) : (document.getElementById('response') || document);
    if(!root) return;
    beautifyPre(root);
    enableListCopy(root);
    renderRawHTML(root);
  }

  // MutationObserver para observar #response e processar adições dinâmicas
  try{
    const target = document.getElementById('response') || document.body;
    const mo = new MutationObserver((mutations)=>{
      for(const m of mutations){
        if(!m.addedNodes) continue;
        for(const n of m.addedNodes){
          if(n.nodeType !== 1) continue;
          if(n.matches && (n.matches('.response-block') || n.matches('.page') || n.querySelector && (n.querySelector('.response-block') || n.querySelector('pre') || n.querySelector('ul')))){
            runAll(n);
          }
        }
      }
    });
    mo.observe(target, { childList: true, subtree: true });
  }catch(e){ console.warn('[TB-LITE] Observer fail', e); }

  // exposições utilitárias
  window.__DUAL_TEXT_BEAUTY_V3_LITE = { runAll };

  // kick inicial após DOMReady
  document.addEventListener('DOMContentLoaded', ()=> setTimeout(()=> runAll('#response'), 80));
  console.info('[TEXT_BEAUTY_V3_LITE] carregado (UI/CSS apenas).');
})();
</script>
<!-- ======= FIM: TEXT_BEAUTY_V3 LITE ======= -->