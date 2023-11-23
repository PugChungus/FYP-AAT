document.addEventListener("DOMContentLoaded", function(event) {
  console.log("DOM Content Loaded");

  const showNavbar = (toggleId, navId, bodyId, headerId) => {
    console.log("Inside showNavbar function");

    const toggle = document.getElementById(toggleId),
      nav = document.getElementById(navId),
      bodypd = document.getElementById(bodyId),
      headerpd = document.getElementById(headerId);

    // Validate that all variables exist
    if (toggle && nav && bodypd && headerpd) {
      console.log("All elements found");

      toggle.addEventListener('click', () => {
        console.log("Toggle clicked");

        // show navbar
        nav.classList.toggle('show');
        // change icon
        toggle.classList.toggle('bx-x');
        // add padding to body
        bodypd.classList.toggle('body-pd');
        // add padding to header
        headerpd.classList.toggle('body-pd');
      });
    } else {
      console.log("Some elements not found");
    }
  };

  showNavbar('header-toggle', 'nav-bar', 'body-pd', 'header');

  /*===== LINK ACTIVE =====*/
  const linkColor = document.querySelectorAll('.nav_link');

  function colorLink() {
    if (linkColor) {
      linkColor.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      console.log("Link clicked - colorLink function");
    }
  }

  linkColor.forEach(l => l.addEventListener('click', colorLink));

  console.log("End of script - DOM fully loaded and ready");
});
