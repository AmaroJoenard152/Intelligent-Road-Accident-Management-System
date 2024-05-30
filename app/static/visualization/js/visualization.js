var modal = document.getElementById("modal");
var modalImg = document.getElementById("modal-image");
var span = document.getElementsByClassName("close")[0];
var images = document.querySelectorAll(".container img");

for (var i = 0; i < images.length; i++) {
    images[i].addEventListener("click", function() {
        modal.style.display = "block";
        modalImg.src = this.src;
    });
}

span.addEventListener("click", function() {
    modal.style.display = "none";
});

function toggleNav() {
    var nav = document.getElementById("mySidenav");
    var texts = document.querySelectorAll(".sidenav a span");
    var menuText = document.getElementById("toggle-btn");

    if (nav.classList.contains("show")) {
        nav.classList.remove("show");
        menuText.style.display = "block";
        texts.forEach(function (text) {
            text.style.opacity = '0';
        });
    } else {
        nav.classList.add("show");
        menuText.style.display = "none";
        texts.forEach(function (text) {
            text.style.opacity = '1';
        });
    }
}

function closeNav() {
    var nav = document.getElementById("mySidenav");
    var menuText = document.getElementById("toggle-btn");
    nav.classList.remove("show");
    menuText.style.display = "block";
}
var rainmap = L.map('rainmap').setView([15.9753, 120.5670], 5.5);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',).addTo(rainmap);

// Customized Rainviewer control options
L.control.rainviewer({
  position: 'bottomleft',
  nextButtonText: 'Next >',
  playStopButtonText: 'Play/Stop',
  prevButtonText: '< Prev',
  positionSliderLabelText: "Select Hour:",
  opacitySliderLabelText: "Adjust Opacity:",
  animationInterval: 4000,
  opacity: 1
}).addTo(rainmap);

document.getElementById('reloadBtn').addEventListener('click', function() {
    // Reset the form values
    document.getElementById('filterForm').reset();
    // Trigger form submission after reset to update visualizations
    document.getElementById('filterForm').submit();
});