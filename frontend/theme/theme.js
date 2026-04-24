export const toggleTheme = () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme");

  root.setAttribute("data-theme", current === "dark" ? "light" : "dark");
};