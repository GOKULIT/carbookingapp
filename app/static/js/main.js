// FAQ Accordion
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.faq-box').forEach(box => {
    box.addEventListener('click', () => {
      box.classList.toggle('active');
    });
  });

  // Default DateTime in Search Pill
  const startInp = document.getElementById('search-start-dt');
  const endInp = document.getElementById('search-end-dt');
  if (startInp && endInp) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const s = new Date(now.getTime() + 2 * 3600 * 1000);
    const e = new Date(now.getTime() + 6 * 3600 * 1000);

    startInp.value = s.toISOString().slice(0, 16);
    endInp.value = e.toISOString().slice(0, 16);
  }
});

function executeSearch() {
  const city = document.getElementById('search-city').value;
  const start = document.getElementById('search-start-dt').value;
  const end = document.getElementById('search-end-dt').value;

  window.location.href = `/fleet?city=${encodeURIComponent(city)}&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
}