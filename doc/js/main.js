// CXOS Reference Documentation — shared behavior

document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav toggle
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  // Tap-to-open dropdowns on touch/mobile (click toggles instead of hover)
  document.querySelectorAll(".nav-list > li").forEach(function (li) {
    var link = li.querySelector(":scope > a");
    var dropdown = li.querySelector(".dropdown");
    if (!link || !dropdown) return;
    link.addEventListener("click", function (e) {
      if (window.matchMedia("(max-width: 860px)").matches) {
        e.preventDefault();
        var wasOpen = li.classList.contains("open");
        document.querySelectorAll(".nav-list > li.open").forEach(function (o) { o.classList.remove("open"); });
        if (!wasOpen) li.classList.add("open");
      }
    });
  });

  // Highlight current top-level nav item based on page path
  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-list > li[data-page]").forEach(function (li) {
    if (li.getAttribute("data-page") === path) li.classList.add("active");
  });

  // Highlight active side-nav link on module pages based on scroll position
  var sideLinks = document.querySelectorAll(".side-nav a[href^='#']");
  var sections = Array.prototype.map.call(sideLinks, function (a) {
    return document.querySelector(a.getAttribute("href"));
  }).filter(Boolean);

  function updateActiveSideLink() {
    var scrollPos = window.scrollY + 120;
    var current = sections[0];
    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) current = sec;
    });
    sideLinks.forEach(function (a) {
      a.classList.toggle("active", current && a.getAttribute("href") === "#" + current.id);
    });
  }
  if (sections.length) {
    window.addEventListener("scroll", updateActiveSideLink, { passive: true });
    updateActiveSideLink();
  }

  // Lightbox for the architecture diagram
  var diagramImg = document.querySelector(".diagram-frame img");
  var lightbox = document.querySelector(".lightbox");
  if (diagramImg && lightbox) {
    var lightboxImg = lightbox.querySelector("img");
    diagramImg.addEventListener("click", function () {
      lightboxImg.src = diagramImg.src;
      lightbox.classList.add("open");
    });
    lightbox.addEventListener("click", function () {
      lightbox.classList.remove("open");
    });
  }
});
