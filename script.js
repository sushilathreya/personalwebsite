    function toggleMenu() {
        var navLinks = document.getElementById("nav-links");
        if (navLinks.classList.contains("show")) {
            navLinks.classList.remove("show");
        } else {
            navLinks.classList.add("show");
        }
    }

// For Tooltip positioning

document.addEventListener('DOMContentLoaded', () => {
    const tooltip = document.getElementById('tooltip');

    document.querySelectorAll('.hover-img').forEach(item => {
        item.addEventListener('mousemove', (e) => {
            const tooltipText = item.getAttribute('data-tooltip');
            tooltip.textContent = tooltipText;
            tooltip.style.left = `${e.pageX + 10}px`; // Adjust the position of the tooltip
            tooltip.style.top = `${e.pageY + 10}px`;
            tooltip.style.visibility = 'visible';
        });

        item.addEventListener('mouseleave', () => {
            tooltip.style.visibility = 'hidden';
        });
    });
});
