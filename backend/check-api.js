(async () => {
  const urls = ['http://127.0.0.1:3000/api/socios','http://127.0.0.1:3000/api/aportes','http://127.0.0.1:3000/api/creditos'];
  for (const u of urls) {
    try {
      const res = await fetch(u);
      const text = await res.text();
      let isJson = true; try { JSON.parse(text); } catch(e) { isJson = false; }
      console.log('\n=>', u);
      console.log('Status:', res.status);
      console.log('Content-Type:', res.headers.get('content-type'));
      console.log('Is JSON:', isJson);
      console.log('Snippet:\n', text.slice(0,600));
    } catch (e) {
      console.error('Error fetching', u, e.message);
    }
  }
})();
