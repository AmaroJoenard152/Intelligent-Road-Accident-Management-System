function updateDateTime() {
    const now = new Date();
    const options = { timeZone: 'Asia/Manila', hour12: true, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' };
    const formattedDateTime = now.toLocaleString('en-US', options);
    document.getElementById('datetime').textContent = formattedDateTime;
}

// Update every second
setInterval(updateDateTime, 1000);

// Initial call
updateDateTime();