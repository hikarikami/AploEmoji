try {
  localStorage.getItem('test');
} catch (e) {
  console.error("localStorage error:", e);
}
