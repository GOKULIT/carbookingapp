function setupBookingCalculator(pricePerHour, carId, rzpKey) {
  const pickupInput = document.getElementById('calc-pickup');
  const dropoffInput = document.getElementById('calc-dropoff');
  const hoursSpan = document.getElementById('val-hours');
  const baseSpan = document.getElementById('val-base');
  const totalSpan = document.getElementById('val-total');

  // Set default pickup to now + 2 hours and dropoff to now + 6 hours
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const start = new Date(now.getTime() + 2 * 3600 * 1000);
  const end = new Date(now.getTime() + 6 * 3600 * 1000);

  pickupInput.value = start.toISOString().slice(0, 16);
  dropoffInput.value = end.toISOString().slice(0, 16);

  function recalculate() {
    const s = new Date(pickupInput.value);
    const e = new Date(dropoffInput.value);
    const diffHours = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60)));

    const baseFare = diffHours * pricePerHour;
    hoursSpan.innerText = `${diffHours} Hours`;
    baseSpan.innerText = `₹${baseFare.toLocaleString()}`;
    totalSpan.innerText = `₹${baseFare.toLocaleString()}`;
    return { diffHours, baseFare };
  }

  pickupInput.addEventListener('change', recalculate);
  dropoffInput.addEventListener('change', recalculate);
  recalculate();

  // Booking Checkout Trigger
  const bookingForm = document.getElementById('detail-booking-form');
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = API.getUser();
    if (!user) {
      openAuthModal('login', () => bookingForm.requestSubmit());
      return;
    }

    const pickupLoc = document.getElementById('pickup-location-select').value;
    const dropoffLoc = document.getElementById('dropoff-location-select').value;
    const pickupDt = pickupInput.value;
    const dropoffDt = dropoffInput.value;

    try {
      const orderData = await API.request('/bookings/create-order', {
        method: 'POST',
        body: JSON.stringify({
          car_id: carId,
          pickup_location: pickupLoc,
          dropoff_location: dropoffLoc,
          pickup_datetime: pickupDt,
          dropoff_datetime: dropoffDt
        })
      });

      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Valam Luxury Cars",
        description: `Hourly Rental Reservation`,
        order_id: orderData.order_id,
        prefill: {
          name: user.full_name,
          email: user.email,
          contact: user.phone
        },
        theme: { color: "#ff6b00" },
        handler: async function (res) {
          try {
            await API.request('/bookings/verify-payment', {
              method: 'POST',
              body: JSON.stringify({
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature
              })
            });
            alert("Reservation & Payment Confirmed!");
            window.location.href = '/my-bookings';
          } catch (verErr) {
            alert(`Payment verification failed: ${verErr.message}`);
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.message);
    }
  });
}