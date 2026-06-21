const axios = require('axios');

async function lookupCompany(name) {
  if (!name || name.length < 2) return { name, found: false };
  try {
    const q = encodeURIComponent(name);
    const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${q}`, { timeout: 8000 });
    if (res.data && res.data.title && res.data.extract) {
      return { name: res.data.title, found: true, extract: res.data.extract.substring(0, 500), url: res.data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${q}`, thumbnail: res.data.thumbnail?.source || null };
    }
  } catch (e) { /* try with spaces */ }
  try {
    const search = await axios.get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&srlimit=1`, { timeout: 5000 });
    const pages = search.data?.query?.search || [];
    if (pages.length > 0) {
      const detail = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pages[0].title)}`, { timeout: 5000 });
      if (detail.data && detail.data.extract) return { name: detail.data.title, found: true, extract: detail.data.extract.substring(0, 500), url: detail.data.content_urls?.desktop?.page || '', thumbnail: detail.data.thumbnail?.source || null };
    }
  } catch (e) {}
  return { name, found: false };
}

module.exports = { lookupCompany };
