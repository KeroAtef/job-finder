/* 
 * Google AdSense Integration for Job Finder
 * 
 * HOW TO SETUP:
 * 1. Get approved at https://adsense.google.com
 * 2. Replace PUBLISHER_ID below with your publisher ID (ca-pub-xxxxxxxxxxxxxx)
 * 3. Uncomment the AdSense script tag in each HTML file's <head>
 * 4. Replace SLOT_ID in each ad unit with your actual ad slot IDs
 * 5. Reload the app
 */

const ADSENSE_CONFIG = {
  enabled: true,
  publisherId: 'ca-pub-3118479728175337',
  slots: {
    sidebar: 'SIDEBAR_SLOT_ID',
    searchBottom: 'SEARCH_BOTTOM_SLOT_ID',
    landingTop: 'LANDING_TOP_SLOT_ID',
    dashboardBottom: 'DASHBOARD_BOTTOM_SLOT_ID',
    loginBottom: 'LOGIN_BOTTOM_SLOT_ID'
  }
};

function initAdsense() {
  if (!ADSENSE_CONFIG.enabled) return;
  try {
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) { }
}

function renderAd(containerId, slotId) {
  if (!ADSENSE_CONFIG.enabled) return;
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const ins = document.createElement('ins');
  ins.className = 'adsbygoogle';
  ins.style.cssText = 'display:block';
  ins.setAttribute('data-ad-client', ADSENSE_CONFIG.publisherId);
  ins.setAttribute('data-ad-slot', slotId);
  ins.setAttribute('data-ad-format', 'auto');
  container.appendChild(ins);
  initAdsense();
}

/* 
 * Revenue Estimate (for your reference):
 * RPM (Revenue Per Mille) for job sites in MENA region: ~$2-5
 * With 1000 daily visitors: ~$3-15/day
 * With 10000 daily visitors: ~$30-150/day
 * 
 * Ad types used:
 * - In-article ads (between content)
 * - Display ads (sidebar)
 * - Responsive ads (mobile-friendly)
 * 
 * All ad slots are responsive and work on mobile/tablet/desktop
 */
