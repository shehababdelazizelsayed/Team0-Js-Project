document.addEventListener("click", function (event) {
  if (!event.target.closest(".profile-wrapper")) {
    document.getElementById("profileDropdown").classList.remove("active");
  }
});

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


function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartCountElem = document.getElementById("cartCount");

  if (cartCountElem) {
    if (count > 0) {
      cartCountElem.textContent = count;
      cartCountElem.style.display = "inline-block";
    } else {
      cartCountElem.style.display = "none";
    }
  }
}


document.addEventListener("DOMContentLoaded", updateCartCount);


document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.querySelector(
    '#searchInput, .search-input, .searchbox, input[name="Search-bar"], input[name="q"], input[type="search"], input.search'
  );
  const searchBtn = document.querySelector(
    '#searchBtn, .search-btn, .search-icon, button[type="submit"], .btn-search'
  );

  function doSearch() {
    if (!searchInput) return;
    const q = (searchInput.value || "").trim();
    if (!q) return;
    const url = `category.html?search=${encodeURIComponent(q)}`;
    window.location.href = url;
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get("search");
    if (qParam && searchInput) {
      searchInput.value = qParam;
    }
  } catch (_) {}

  if (searchInput) {
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSearch();
      }
    });
    const form = searchInput.closest("form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        doSearch();
      });
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      doSearch();
    });
  }
});
