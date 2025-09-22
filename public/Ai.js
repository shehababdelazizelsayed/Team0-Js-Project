const firebaseConfig = {
  apiKey: "AIzaSyD9ghRnC-TMJ-TV6TJxdGH_7qgRsT6Po04",
  authDomain: "project-d6110.firebaseapp.com",
  projectId: "project-d6110",
  storageBucket: "project-d6110.firebasestorage.app",
  messagingSenderId: "402041654228",
  appId: "1:402041654228:web:2430f53e2afb775e242441",
  measurementId: "G-0ZLPYLVJ4Y",
};

const apiKey = "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";
let isChatOpen = false;
let db;
let productsData = [];
let productsLoaded = false;
let firebaseInitialized = false;

// Initialize everything on page load
window.addEventListener("load", initializeApp);

async function initializeApp() {
  await initializeFirebase();
  await loadProducts();
  enableChat();
}

async function initializeFirebase() {
  try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    firebaseInitialized = true;
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
    updateStatus("error", "DB Error");
    addSystemMessage("❌ Failed to connect to database");
  }
}

async function loadProducts() {
  if (!firebaseInitialized) return;

  try {
    updateStatus("loading", "Loading...");

    const snapshot = await db.collection("products").get();
    productsData = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      productsData.push({
        id: doc.id,
        name: data.Name || data.name || "Unknown Product",
        price: parseFloat(data.price || 0),
        description: data.description || "",
        category: data.cate || data.category || "general",
        brand: data.brand || "",
        stock: parseInt(data.stock || 0),
        ...data,
      });
    });

    productsLoaded = true;
    updateStatus("connected", `${productsData.length} Products`);
    addSystemMessage(
      `✅ Successfully loaded ${productsData.length} products from your catalog! I can now help you with product recommendations, pricing, availability, and more.`
    );

    console.log(`Loaded ${productsData.length} products from Firebase`);
  } catch (error) {
    console.error("Error loading products:", error);
    updateStatus("error", "Load Failed");
    addSystemMessage(
      "❌ Failed to load products. I can still help with general questions."
    );
  }
}

function updateStatus(type, text) {
  const indicator = document.getElementById("statusIndicator");
  indicator.className = `status-indicator status-${type}`;
  indicator.textContent = text;
}

function addSystemMessage(message) {
  const chatMessages = document.getElementById("chatMessages");
  const systemMessage = document.createElement("div");
  systemMessage.className = "message ai";
  systemMessage.textContent = message;
  chatMessages.appendChild(systemMessage);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function enableChat() {
  const input = document.getElementById("question");
  const sendBtn = document.getElementById("sendBtn");

  input.disabled = false;
  input.placeholder = "Ask me anything...";
  sendBtn.disabled = false;
}

function createProductContext() {
  if (!productsLoaded || productsData.length === 0) {
    return "\n\nNote: Product catalog is still loading or unavailable.";
  }

  let context = `\n\nAVAILABLE PRODUCTS (${productsData.length} total):\n`;

  // Group by category for better organization
  const categories = {};
  productsData.forEach((product) => {
    const cat = product.category || "general";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(product);
  });

  // Add products by category (limit to prevent token overflow)
  Object.keys(categories)
    .slice(0, 8)
    .forEach((category) => {
      context += `\n${category.toUpperCase()}:\n`;
      categories[category].slice(0, 5).forEach((product) => {
        context += `- ${product.name} | $${product.price}`;
        if (product.description) {
          context += ` | ${product.description.substring(0, 80)}...`;
        }
        context += `\n`;
      });
    });

  context +=
    "\nWhen customers ask about products, provide specific recommendations from this catalog with names, prices, and reasons why they're good choices.";
  return context;
}

function toggleChat() {
  const chatContainer = document.getElementById("chatContainer");
  const chatButton = document.getElementById("chatButton");
  const chatIcon = document.getElementById("chatIcon");

  if (isChatOpen) {
    closeChat();
  } else {
    openChat();
  }
}

function openChat() {
  const chatContainer = document.getElementById("chatContainer");
  const chatButton = document.getElementById("chatButton");
  const chatIcon = document.getElementById("chatIcon");

  chatContainer.classList.add("show");
  chatButton.classList.add("active");
  chatIcon.textContent = "✕";
  isChatOpen = true;

  // Focus on input
  setTimeout(() => {
    document.getElementById("question").focus();
  }, 300);
}

function closeChat() {
  const chatContainer = document.getElementById("chatContainer");
  const chatButton = document.getElementById("chatButton");
  const chatIcon = document.getElementById("chatIcon");

  chatContainer.classList.remove("show");
  chatButton.classList.remove("active");
  chatIcon.textContent = "💬";
  isChatOpen = false;
}

async function ask() {
  const question = document.getElementById("question").value;
  const chatMessages = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("sendBtn");

  if (!question.trim()) return;

  // Add user message
  const userMessage = document.createElement("div");
  userMessage.className = "message user";
  userMessage.textContent = question;
  chatMessages.appendChild(userMessage);

  // Add thinking message
  const thinkingMessage = document.createElement("div");
  thinkingMessage.className = "message ai thinking";
  thinkingMessage.innerHTML =
    '<span style="color: #0d82b3;">🤔</span> Thinking...';
  chatMessages.appendChild(thinkingMessage);

  // Clear input and disable button
  document.getElementById("question").value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    // Create enhanced prompt with product context
    const productContext = createProductContext();
    const systemPrompt = `You are a helpful AI assistant for an ecommerce store. You have access to the store's product catalog and can make specific product recommendations.${productContext}

When responding:
1. Be concise and helpful
2. For product recommendations, format each product as: **Product Name** - $Price (brief description)
3. Group similar products together
4. Use bullet points for lists
5. Keep responses under 200 words when possible
6. Always reference actual products from the catalog when making recommendations
7. If asked about availability or stock, check the catalog data`;

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: question },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();

    // Remove thinking message
    chatMessages.removeChild(thinkingMessage);

    // Add AI response with enhanced formatting
    const aiMessage = document.createElement("div");
    aiMessage.className = "message ai";

    let content = data.choices[0].message.content;
    content = formatAIResponse(content);

    aiMessage.innerHTML = `<div class="content">${content}</div>`;
    chatMessages.appendChild(aiMessage);
  } catch (error) {
    console.error("AI Error:", error);

    // Remove thinking message
    if (thinkingMessage.parentNode) {
      chatMessages.removeChild(thinkingMessage);
    }

    // Add formatted error message
    const errorMessage = document.createElement("div");
    errorMessage.className = "message ai";
    errorMessage.innerHTML = `<div class="error-message">
                    <strong>Connection Error</strong><br>
                    ${
                      error.message.includes("Failed to fetch")
                        ? "Please check your internet connection"
                        : error.message
                    }
                </div>`;
    chatMessages.appendChild(errorMessage);
  } finally {
    // Re-enable button
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function formatAIResponse(content) {
  // Enhanced formatting for better readability

  // Format product recommendations with special styling
  content = content.replace(
    /\*\*(.*?)\*\* - \$([\d.]+)(.*?)(?=\n|\*\*|$)/g,
    '<div class="product-recommendation">' +
      '<div class="product-name">$1</div>' +
      '<div class="product-price">$$2</div>' +
      '<div class="product-description">$3</div>' +
      "</div>"
  );

  // Format regular bold text
  content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Format bullet points
  content = content.replace(/^- (.*$)/gm, "• $1");
  content = content.replace(
    /^• /gm,
    '<span style="color: #0d82b3; font-weight: bold;">•</span> '
  );

  // Format numbered lists
  content = content.replace(
    /^(\d+)\. (.*$)/gm,
    '<span style="color: #0d82b3; font-weight: bold;">$1.</span> $2'
  );

  // Convert line breaks to HTML
  content = content.replace(/\n\n/g, "<br><br>");
  content = content.replace(/\n/g, "<br>");

  // Format categories/headers (text followed by colon)
  content = content.replace(
    /^([A-Z\s]+):/gm,
    '<div class="category-header">$1</div>'
  );

  return content;
}

function handleKeyPress(event) {
  if (event.key === "Enter") {
    ask();
  }
}

function searchMessages() {
  const searchTerm = event.target.value.toLowerCase();
  const messages = document.querySelectorAll(".message");

  messages.forEach((message) => {
    if (message.textContent.toLowerCase().includes(searchTerm)) {
      message.style.display = "block";
    } else {
      message.style.display = searchTerm ? "none" : "block";
    }
  });
}

// Close chat when clicking outside
document.addEventListener("click", function (event) {
  const chatContainer = document.getElementById("chatContainer");
  const chatButton = document.getElementById("chatButton");

  if (
    isChatOpen &&
    !chatContainer.contains(event.target) &&
    !chatButton.contains(event.target)
  ) {
    closeChat();
  }
});

// Prevent chat from closing when clicking inside
document
  .getElementById("chatContainer")
  .addEventListener("click", function (event) {
    event.stopPropagation();
  });
