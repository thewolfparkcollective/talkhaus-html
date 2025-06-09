function showAlert(action) {
  alert(action + ' coming soon!');
}

function subscribeNewsletter(event) {
  event.preventDefault();
  const emailInput = document.getElementById('email');
  if (emailInput.value) {
    alert('Thank you for subscribing, ' + emailInput.value + '!');
    emailInput.value = '';
  }
}
