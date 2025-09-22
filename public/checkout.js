function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function renderCheckoutCart() {
  const cart = getCart();
  const tbody = document.querySelector(".cart-table tbody");
  tbody.innerHTML = "";
  let fullTotal = 0;
  cart.forEach((item) => {
    const totalPrice = item.price * item.quantity;
    fullTotal += totalPrice;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><img src="${item.image}" alt="${item.name}" width="60"/></td>
      <td>${item.name}</td>
      <td>${item.brand || "-"}</td>
      <td>
        <div class="quantity-control">
          <input type="text" value="${item.quantity}" readonly />
        </div>
      </td>
      <td>${item.price} EGP</td>
      <td>${totalPrice} EGP</td>
    `;
    tbody.appendChild(row);
  });

  const totalBox = document.querySelector(".totals-box");
  if (totalBox) {
    let finalTotal = localStorage.getItem("finalTotal");
    if (!finalTotal) finalTotal = fullTotal;
    totalBox.querySelector("p span").textContent = `${fullTotal} EGP`;

    const shipment = 20;
    totalBox.querySelector(
      "p:nth-child(2) span"
    ).textContent = `${shipment} EGP`;
    totalBox.querySelector("strong span").textContent = `${
      parseInt(finalTotal) + shipment
    } EGP`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderCheckoutCart();
});

// const confirmBtn = document.querySelector(".confirm-btn");
// if (confirmBtn) {
//   confirmBtn.addEventListener("click", () => {
//     console.log("Thank you! Your order has been confirmed.");
//   });
// }

// ===================== payment =====================
const confirmBtn = document.querySelector(".confirm-btn");
if (confirmBtn) {
  confirmBtn.addEventListener("click", () => {
    const method = document.querySelector(
      'input[name="payment"]:checked'
    ).value;

    if (method === "cod") {
      alert("Order placed with Cash on Delivery!");
      return;
    }

    if (method === "card") {
      document.querySelector(
        ".confirm-order"
      ).innerHTML = `<div id="paypal-button-container"></div>`;

      paypal
        .Buttons({
          createOrder: function (data, actions) {
            const totalText = document.querySelector(
              ".totals-box strong span"
            ).textContent;
            const totalNumber = parseFloat(totalText.replace(/[^\d.]/g, ""));
            return actions.order.create({
              purchase_units: [
                {
                  amount: { value: totalNumber.toString() },
                },
              ],
            });
          },
          onApprove: function (data, actions) {
            window.location.href = "success.html";
          },
          onCancel: function () {
            window.location.href = "cancel.html";
          },
        })
        .render("#paypal-button-container");
    }
  });
}
