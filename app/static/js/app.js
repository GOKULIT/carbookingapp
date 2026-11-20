let catalogCars = [];
let currentSelectedCar = null;

async function fetchCars(category = 'all') {
  try {
    const cars = await API.request(`/cars?category=${category}`);
    catalogCars = cars;
    renderCarFleet(cars);
  } catch (err) {
    console.error('Failed loading fleet:', err);
  }
}

function renderCarFleet(cars) {
  const grid = document.getElementById('car-grid');
  if (!grid) return;

  if (cars.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No luxury cars found under this category.</div>`;
    return;
  }

  grid.innerHTML = cars.map(car => `
    <div class="car-card">
      <div class="card-media">
        <img src="${car.image_url}" alt="${car.name}" loading="lazy" />
      </div>
      <div class="card-body">
        <span class="card-tag">${car.category} &bull; ${car.brand}</span>
        <h3 class="card-title">${car.name}</h3>
        <div class="car-specs">
          <span>⚙️ ${car.transmission}</span>
          <span>⛽ ${car.fuel_type}</span>
          <span>👥 ${car.seating_capacity} Seats</span>
        </div>
        <div class="card-footer">
          <div class="price-tag">
            <span class="price-amount">₹${car.price_per_hour}</span>
            <span class="price-unit">per hour billing</span>
          </div>
          <button class="btn btn-primary" onclick="initiateBooking(${car.id})">Book Now</button>
        </div>
      </div>
    </div>
  `).join('');
}

function initiateBooking(carId) {
  const car = catalogCars.find(c => c.id === carId);
  if (!car) return;

  const user = API.getUser();
  if (!user) {
    openAuthModal('login', () => launchBookingModal(car));
    return;
  }
  launchBookingModal(car);
}

function launchBookingModal(car) {
  currentSelectedCar = car;
  document.getElementById('booking-car-name').innerText = car.name;
  document.getElementById('booking-rate').innerText = `₹${car.price_per_hour} / hr`;
  
  // Set defaults for pick up (now + 1 hour) and drop off (now + 5 hours)
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const nowPlusOne = new Date(now.getTime() + 60 * 60 * 1000);
  const nowPlusFive = new Date(now.getTime() + 5 * 60 * 60 * 1000);

  document.getElementById('booking-pickup').value = nowPlusOne.toISOString().slice(0, 16);
  document.getElementById('booking-dropoff').value = nowPlusFive.toISOString().slice(0, 16);

  recomputeEstimatedFare();
  document.getElementById('booking-modal').classList.add('active');
}

function closeBookingModal() {
  document.getElementById('booking-modal').classList.remove('active');
  currentSelectedCar = null;
}

function recomputeEstimatedFare() {
  if (!currentSelectedCar) return;
  const pickupVal = document.getElementById('booking-pickup').value;
  const dropoffVal = document.getElementById('booking-dropoff').value;

  if (!pickupVal || !dropoffVal) return;

  const start = new Date(pickupVal);
  const end = new Date(dropoffVal);
  const diffHours = Math.ceil((end - start) / (1000 * 60 * 60));

  const validHours = diffHours > 0 ? diffHours : 1;
  const total = validHours * currentSelectedCar.price_per_hour;

  document.getElementById('calc-hours').innerText = `${validHours} hrs`;
  document.getElementById('calc-total').innerText = `₹${total}`;
}

async function handleRazorpayCheckout(e) {
  e.preventDefault();
  if (!currentSelectedCar) return;

  const location = document.getElementById('booking-location').value;
  const pickup = document.getElementById('booking-pickup').value;
  const dropoff = document.getElementById('booking-dropoff').value;

  try {
    const payload = {
      car_id: currentSelectedCar.id,
      pickup_location: location,
      pickup_datetime: pickup,
      dropoff_datetime: dropoff
    };

    // 1. Create order on backend
    const orderData = await API.request('/bookings/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    const user = API.getUser();

    // 2. Open Razorpay Modal
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Valam Luxury Cars",
      description: `Reservation for ${currentSelectedCar.name}`,
      order_id: orderData.order_id,
      prefill: {
        name: user.full_name,
        email: user.email,
        contact: user.phone
      },
      theme: {
        color: "#f59e0b"
      },
      handler: async function (response) {
        // 3. Verify Razorpay Signature
        try {
          await API.request('/bookings/verify-payment', {
            method: 'POST',
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
          });

          alert("Booking & Payment Confirmed! Check your email for booking pass.");
          closeBookingModal();
          location.reload();
        } catch (verifErr) {
          alert(`Verification failed: ${verifErr.message}`);
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    alert(err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchCars();

  // Filter chips handler
  document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      fetchCars(chip.dataset.category);
    });
  });

  const pickupInput = document.getElementById('booking-pickup');
  const dropoffInput = document.getElementById('booking-dropoff');
  if (pickupInput && dropoffInput) {
    pickupInput.addEventListener('change', recomputeEstimatedFare);
    dropoffInput.addEventListener('change', recomputeEstimatedFare);
  }

  const bookingForm = document.getElementById('booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleRazorpayCheckout);
  }
});