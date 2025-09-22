document.getElementById("emailBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  document.getElementById("emailBox").classList.toggle("active");
  document.getElementById("phoneBox").classList.remove("active");
});

document.getElementById("phoneBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  document.getElementById("phoneBox").classList.toggle("active");
  document.getElementById("emailBox").classList.remove("active");
});

document.addEventListener("click", function (event) {
  if (!event.target.closest(".wrapper")) {
    document.getElementById("emailBox").classList.remove("active");
    document.getElementById("phoneBox").classList.remove("active");
  }
});

const cartBtn = document.getElementById("cartBtn");
if (cartBtn) {
  cartBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    window.location.href = "./cart.html";
  });
}

function redirectToProfile() {
  window.location.href = "./profile.html";
}


