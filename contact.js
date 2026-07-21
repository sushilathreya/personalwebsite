const copyEmailButton = document.querySelector("#copy-email");
const copyEmailLabel = copyEmailButton.querySelector("span");
const copyStatus = document.querySelector("#copy-status");
const emailAddress = copyEmailButton.dataset.email;
let resetLabelTimer;

async function copyEmailAddress() {
  try {
    await navigator.clipboard.writeText(emailAddress);
  } catch {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = emailAddress;
    fallbackInput.setAttribute("readonly", "");
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    document.body.append(fallbackInput);
    fallbackInput.select();
    document.execCommand("copy");
    fallbackInput.remove();
  }

  window.clearTimeout(resetLabelTimer);
  copyEmailLabel.textContent = "Copied";
  copyStatus.textContent = `${emailAddress} copied to your clipboard.`;
  resetLabelTimer = window.setTimeout(() => {
    copyEmailLabel.textContent = "Copy email";
  }, 2000);
}

copyEmailButton.addEventListener("click", copyEmailAddress);
