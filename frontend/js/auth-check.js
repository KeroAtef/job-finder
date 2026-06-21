(async function() {
  const token = localStorage.getItem('jf_token');
  if (!token) {
    window.location.href = '../login.html';
    return;
  }
  try {
    const res = await fetch('/api/auth/me', { headers: { 'Authorization': 'Bearer ' + token } });
    if (res.status === 403) {
      const data = await res.json();
      alert('⌛ ' + (data.message || 'انتهت صلاحية الاشتراك'));
      window.location.href = '../login.html';
      return;
    }
    if (!res.ok) {
      localStorage.removeItem('jf_token');
      window.location.href = '../login.html';
      return;
    }
    const data = await res.json();
    if (data.user && data.user.subscriptionActive === false) {
      alert('⌛ انتهت صلاحية اشتراكك. تواصل مع +201220714614 للتجديد');
      window.location.href = '../login.html';
      return;
    }
  } catch (e) {
    // Allow offline dev without MongoDB
    console.log('Auth check skipped (offline mode)');
  }
})();
