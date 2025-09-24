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

// Stock validation function
async function validateStockAvailability() {
  const cart = getCart();
  const stockIssues = [];
  
  try {
    // Import Firebase functions dynamically
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
    
    const firebaseConfig = {
      apiKey: "AIzaSyD9ghRnC-TMJ-TV6TJxdGH_7qgRsT6Po04",
      authDomain: "project-d6110.firebaseapp.com",
      projectId: "project-d6110",
      storageBucket: "project-d6110.firebasestorage.app",
      messagingSenderId: "402041654228",
      appId: "1:402041654228:web:2430f53e2afb775e242441",
      measurementId: "G-0ZLPYLVJ4Y",
    };
    
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    for (const item of cart) {
      const productRef = doc(db, "products", item.id);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        const availableStock = productData.stockQuantity || 0;
        
        if (availableStock < item.quantity) {
          stockIssues.push({
            name: item.name,
            requested: item.quantity,
            available: availableStock
          });
        }
      }
    }
    
    return stockIssues;
  } catch (error) {
    console.error("Error validating stock:", error);
    return [];
  }
}

// ===================== payment =====================
async function finalizeOrderAndDeductStock(paymentMethod) {
  const cart = getCart();
  if (!cart || cart.length === 0) return { ok: true };

  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js");
    const { getFirestore, doc, runTransaction } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

    const firebaseConfig = {
      apiKey: "AIzaSyD9ghRnC-TMJ-TV6TJxdGH_7qgRsT6Po04",
      authDomain: "project-d6110.firebaseapp.com",
      projectId: "project-d6110",
      storageBucket: "project-d6110.firebasestorage.app",
      messagingSenderId: "402041654228",
      appId: "1:402041654228:web:2430f53e2afb775e242441",
      measurementId: "G-0ZLPYLVJ4Y",
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Single transaction to update all product stocks atomically
    await runTransaction(db, async (tx) => {
      for (const item of cart) {
        const ref = doc(db, "products", item.id);
        const snap = await tx.get(ref);
        if (!snap.exists()) throw new Error("Product not found: " + item.name);
        const data = snap.data();
        const available = data.stockQuantity || 0;
        if (available < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${available}, requested: ${item.quantity}`);
        }
        tx.update(ref, { stockQuantity: available - item.quantity });
      }
    });

    // Clear local cart after successful stock deduction
    localStorage.removeItem("cart");
    localStorage.removeItem("finalTotal");
    return { ok: true };
  } catch (e) {
    console.error("Error finalizing order:", e);
    return { ok: false, error: e?.message || "Failed to place order" };
  }
}
const confirmBtn = document.querySelector(".confirm-btn");
if (confirmBtn) {
  confirmBtn.addEventListener("click", async () => {
    // Validate stock availability first
    const stockIssues = await validateStockAvailability();
    if (stockIssues.length > 0) {
      let message = "Stock issues detected:\n";
      stockIssues.forEach(issue => {
        message += `• ${issue.name}: Only ${issue.available} available (requested ${issue.requested})\n`;
      });
      message += "\nPlease update your cart and try again.";
      alert(message);
      return;
    }

    const method = document.querySelector(
      'input[name="payment"]:checked'
    ).value;

    if (method === "cod") {
      const res = await finalizeOrderAndDeductStock("cod");
      if (!res.ok) {
        alert(res.error || "Failed to place order. Please try again.");
        return;
      }
      window.location.href = "success.html";
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
          onApprove: async function (data, actions) {
            const res = await finalizeOrderAndDeductStock("card");
            if (!res.ok) {
              alert(res.error || "Payment captured but order failed. Contact support.");
              return;
            }
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
