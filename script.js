// x01 AI — frontend-only oracle
// Uses CoinCap public API and Google Translate public endpoint
// Auto-refresh every 10 seconds

const symbols = ["BTC","ETH","BNB","SOL","MATIC"];
const intervalMs = 10000;

const askBtn = document.getElementById('askBtn');
const queryInput = document.getElementById('query');
const symbolSelect = document.getElementById('symbolSelect');
const langInfo = document.getElementById('langInfo');
const priceText = document.getElementById('priceText');
const ctx = document.getElementById('priceChart').getContext('2d');

let chart = null;
let lastPrices = {}; // store latest prices

// Translate text to English using Google Translate public endpoint
async function translateToEnglish(text){
  try{
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if(!res.ok) throw new Error('Translate failed');
    const data = await res.json();
    // data[2] may include detected language; data[0][0][0] is translated text
    const detected = (data && data[2]) ? data[2] : (data && data[0] && data[0][0] && data[0][0][2]) || 'auto';
    const translated = data && data[0] && data[0][0] && data[0][0][0] ? data[0][0][0] : text;
    return {translated, detected};
  }catch(e){
    console.warn('Translate error',e);
    return {translated:text, detected:'unknown'};
  }
}

// Fetch multiple assets price from CoinCap (public, no key)
async function fetchPrices(){
  try{
    const res = await fetch('https://api.coincap.io/v2/assets?limit=200');
    const json = await res.json();
    const map = {};
    for(const item of json.data){
      const sym = item.symbol.toUpperCase();
      if(symbols.includes(sym)) map[sym] = parseFloat(item.priceUsd);
    }
    // fallback: if some symbol not found, set null
    for(const s of symbols) if(!(s in map)) map[s] = null;
    lastPrices = map;
    return map;
  }catch(e){
    console.error('fetchPrices error', e);
    return lastPrices || symbols.reduce((a,s)=>{a[s]=null;return a},{});
  }
}

function drawChart(priceMap, highlightSymbol){
  const labels = symbols;
  const data = labels.map(l => priceMap[l] || 0);
  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Price (USD)',
        data,
        backgroundColor: labels.map(l => l===highlightSymbol ? 'rgba(6,182,212,0.95)' : 'rgba(99,102,241,0.8)')
      }]
    },
    options: {
      responsive:true,
      plugins:{
        legend:{display:false},
        tooltip:{mode:'index'}
      },
      scales:{
        y:{ beginAtZero:false, ticks:{callback: val => '$'+Number(val).toLocaleString()} }
      }
    }
  });
}

// Update UI with one highlighted symbol
function updateUI(symbol){
  const price = lastPrices[symbol];
  const priceTextFormatted = (price==null) ? 'Price not available' : `$${Number(price).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:6})}`;
  priceText.textContent = `${symbol} → ${priceTextFormatted}`;
  drawChart(lastPrices, symbol);
}

// Auto refresh prices periodically
async function autoRefresh(){
  const prices = await fetchPrices();
  const current = symbolSelect.value || 'BTC';
  updateUI(current);
}

// When user clicks Ask: detect language, translate, find symbol
askBtn.addEventListener('click', async ()=>{
  const text = (queryInput.value || '').trim();
  if(!text){ alert('Please type a question (any language).'); return; }

  const {translated, detected} = await translateToEnglish(text);
  langInfo.textContent = `Detected: ${detected} — Translated: "${translated}"`;

  // naive symbol detection from translated text
  let chosen = symbols.find(s => translated.toLowerCase().includes(s.toLowerCase()));
  if(!chosen){
    // check common names
    if(/ethereum|eth/.test(translated.toLowerCase())) chosen='ETH';
    if(/binance|bnb/.test(translated.toLowerCase())) chosen='BNB';
    if(/solana|sol/.test(translated.toLowerCase())) chosen='SOL';
    if(/matic|polygon/.test(translated.toLowerCase())) chosen='MATIC';
  }
  if(!chosen) chosen = symbolSelect.value || 'BTC';
  symbolSelect.value = chosen;
  updateUI(chosen);
});

// symbol select change
symbolSelect.addEventListener('change', ()=> updateUI(symbolSelect.value));

// initial load
(async ()=>{
  await fetchPrices();
  updateUI(symbolSelect.value || 'BTC');
  // set interval
  setInterval(async ()=>{
    await fetchPrices();
    updateUI(symbolSelect.value || 'BTC');
  }, intervalMs);
})();
