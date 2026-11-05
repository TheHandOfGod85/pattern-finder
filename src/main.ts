import "./styles.css";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (appElement === null) {
  throw new Error("The app element is missing from index.html.");
}

appElement.textContent = "Pattern Finder";
