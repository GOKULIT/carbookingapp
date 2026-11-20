async function checkAdminAuth() {
  const user = API.getUser();
  if (!user || user.role !== 'admin') {
    alert('Access restricted. Admin authentication required.');
    window.location.href = '/';
  }
}

async function loadDashboardStats() {
  try {
    const stats = await API.request('/admin/stats');
    document.getElementById('stat-cars').innerText = stats.total_cars;
    document.getElementById('stat-revenue').innerText = `₹${stats.total_revenue.toLocaleString()}`;
    document.getElementById('stat-bookings').innerText = stats.total_bookings;
    document.getElementById('stat-users').innerText = stats.total_users;
  } catch (e) {
    console.error(e);
  }
}

async function loadBookingsLedger() {
  try {
    const bookings = await API.request('/admin/bookings');
    const tbody = document.getElementById('admin-bookings-tbody');
    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>#${b.id}</td>
        <td><b>${b.user ? b.user.full_name : 'N/A'}</b><br><small style="color:var(--text-muted)">${b.user ? b.user.phone : ''}</small></td>
        <td>${b.car ? b.car.name : 'Deleted Car'}</td>
        <td>${b.pickup_location}</td>
        <td>${b.pickup_datetime} to ${b.dropoff_datetime} (${b.total_hours} hrs)</td>
        <td>₹${b.total_amount}</td>
        <td><span style="color:${b.payment_status === 'SUCCESS' ? '#10b981' : '#ef4444'}">${b.payment_status}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function loadAdminCarList() {
  try {
    const cars = await API.request('/cars');
    const tbody = document.getElementById('admin-cars-tbody');
    tbody.innerHTML = cars.map(c => `
      <tr>
        <td><img src="${c.image_url}" width="60" style="border-radius:4px" /></td>
        <td><b>${c.name}</b> (${c.brand})</td>
        <td>${c.category}</td>
        <td>₹${c.price_per_hour}/hr</td>
        <td>
          <button class="btn btn-danger" style="padding:0.3rem 0.6rem; font-size:0.75rem" onclick="deleteCar(${c.id})">Remove</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    console.error(err);
  }
}

async function deleteCar(id) {
  if (!confirm('Permanently remove this car from inventory?')) return;
  try {
    await API.request(`/admin/cars/${id}`, { method: 'DELETE' });
    loadAdminCarList();
    loadDashboardStats();
  } catch (e) {
    alert(e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  loadDashboardStats();
  loadBookingsLedger();
  loadAdminCarList();

  const addCarForm = document.getElementById('add-car-form');
  if (addCarForm) {
    addCarForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(addCarForm);
      try {
        await API.request('/admin/cars', {
          method: 'POST',
          body: formData
        });
        alert('Car cataloged successfully!');
        addCarForm.reset();
        loadAdminCarList();
        loadDashboardStats();
      } catch (err) {
        alert(err.message);
      }
    });
  }
});