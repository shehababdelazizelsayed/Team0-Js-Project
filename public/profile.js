document.querySelector(".submit").addEventListener("click", function (e) {
  e.preventDefault();

  const oldPassword = document.querySelector(".old-Password").value;
  const newPassword = document.querySelector(".Password").value;
  const confirmPassword = document.querySelector(".confirm-Password").value;

  if (newPassword !== confirmPassword) {
    console.warn("New passwords do not match!");
    return;
  }

  if (newPassword && newPassword.length < 6) {
    console.warn("Password must be at least 6 characters long!");
    return;
  }

  console.log("Profile updated successfully!");
});

document.querySelector(".vieworders").addEventListener("click", function () {
  console.log("Showing all orders functionality would go here");
});

document.querySelector(".Email").addEventListener("blur", function () {
  const email = this.value;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (email && !emailPattern.test(email)) {
    this.style.borderColor = "#FF6B6B";
    console.warn("Please enter a valid email address");
  } else {
    this.style.borderColor = "#e0e0e0";
  }
});

document.querySelector(".Password").addEventListener("input", function () {
  const password = this.value;
  const strengthIndicator =
    document.getElementById("password-strength") || createStrengthIndicator();

  if (password.length === 0) {
    strengthIndicator.textContent = "";
    return;
  }

  let strength = "Weak";
  let color = "#FF6B6B";

  if (password.length >= 8) {
    strength = "Medium";
    color = "#FFB347";
  }

  if (
    password.length >= 10 &&
    /[0-9]/.test(password) &&
    /[A-Z]/.test(password)
  ) {
    strength = "Strong";
    color = "#4caf50";
  }

  strengthIndicator.textContent = `Password strength: ${strength}`;
  strengthIndicator.style.color = color;
});

function createStrengthIndicator() {
  const indicator = document.createElement("div");
  indicator.id = "password-strength";
  indicator.style.marginTop = "-1em";
  indicator.style.marginBottom = "1.5em";
  indicator.style.fontSize = "0.9em";
  document
    .querySelector(".Password")
    .parentNode.insertBefore(
      indicator,
      document.querySelector(".confirm-Password")
    );
  return indicator;
}
