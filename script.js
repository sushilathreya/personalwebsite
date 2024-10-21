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

function filterProjects(tag) {
    const projects = document.querySelectorAll('.project-card');
    const tags = document.querySelectorAll('.tag-filter .tag');
    
    tags.forEach(t => {
        if (t.innerText.toLowerCase() === tag.toLowerCase() || (tag === 'all' && t.innerText.toLowerCase() === 'all')) {
            t.classList.add('active');
        } else {
            t.classList.remove('active');
        }
    });
    
    projects.forEach(project => {
        if (tag === 'all') {
            project.style.display = 'block';
        } else {
            const projectTags = project.getAttribute('data-tags').split(' ');
            if (projectTags.includes(tag)) {
                project.style.display = 'block';
            } else {
                project.style.display = 'none';
            }
        }
    });  
}

function openLightbox(image) {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    
    lightbox.style.display = 'flex';
    lightboxImg.src = image.src;
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'none';
}
