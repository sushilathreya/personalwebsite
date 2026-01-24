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
  
  if (image.dataset.gif) {
    // For GIFs, just open the GIF URL in new tab (CORS workaround)
    window.open(image.dataset.gif, '_blank');
    return;
  } else {
    // For images, use img element
    const video = lightbox.querySelector('video');
    if (video) video.style.display = 'none';
    lightboxImg.style.display = 'block';
    lightboxImg.src = image.dataset.full || image.src;
  }
  
  lightbox.style.display = 'flex';
}

function closeLightbox() {
  const lightbox = document.getElementById('lightbox');
  lightbox.style.display = 'none';
  const video = lightbox.querySelector('video');
  if (video) {
    video.pause();
    video.src = '';
  }
}

// ArtiLike rendering helpers
function renderArtiLikeBookmarks(){
  const grid = document.getElementById('artilike-grid');
  if(!grid) return;
  fetch('data/twitterBookmarks.json')
    .then(r => r.json())
    .then(items => {
      const cards = items.filter(b => b.media && b.media[0]).reverse().map(b => {
        const imageTag = (b.media && b.media[0]) ? `<div class="bookmark-media"><img src="${b.media[0].type === 'video' ? (b.media[0].thumbnail || b.media[0].url || '') : (b.media[0].type === 'animated_gif' ? b.media[0].thumbnail : (b.media[0].original || b.media[0].url || ''))}" alt="Artwork" onclick="openLightbox(this)" data-full="${b.media[0].type === 'video' ? (b.media[0].original || b.media[0].url || '') : (b.media[0].type === 'animated_gif' ? b.media[0].thumbnail : (b.media[0].original || b.media[0].url || ''))}" data-gif="${b.media[0].type === 'animated_gif' || b.media[0].type === 'video' ? b.media[0].url : ''}" /></div>` : '';
      const mediaTypeTag = b.media && b.media[0] ? (b.media.length > 1 ? 'MUL' : (b.media[0].type === 'animated_gif' || b.media[0].type === 'video' ? 'VID' : 'IMG')) : '';
        const caption = (b.full_text || b.text || '').replace(/https?:\/\/[^\s]+/g, '').trim();
        const authorAvatar = b.profile_image_url || b.author?.profile_image_url || '';
        const authorName = b.author?.name || b.name || '';
        const authorHandle = b.author?.screen_name || b.screen_name || '';
        const tweetUrl = b.url || '#';
        return `<div class="bookmark-card">
          ${imageTag}
          <div class="bookmark-content">
            <div class="bookmark-meta">
              <img class="author-avatar" src="${authorAvatar}" alt="${authorName}">
              <div class="author-info">
                <span class="author-name">${authorName}</span>
                <span class="author-handle">${authorHandle}</span>
              </div>
            </div>
<div class="bookmark-title" title="${caption}">${caption.length > 60 ? caption.substring(0, 57) + '...' : caption}</div>
          <div style="display: flex; align-items: center; gap: 6px; justify-content: space-between;">
            <a class="bookmark-link" href="${tweetUrl}" target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              View original
            </a>
            ${mediaTypeTag ? `<span class="media-type-tag">${mediaTypeTag}</span>` : ''}
          </div>
          </div>
        </div>`;
      }).join('');
      grid.innerHTML = cards;
      
      // Set OG image from latest bookmark (reverse order makes newest first)
      setTimeout(() => {
        if (items.length > 0 && items[0].media && items[0].media[0]) {
          const latestImage = items[0].media[0].original || items[0].media[0].url || '';
          console.log('Setting OG image to:', latestImage);
          const ogMeta = document.querySelector('meta[property="og:image"]');
          const twitterMeta = document.querySelector('meta[name="twitter:image"]');
          if (ogMeta) ogMeta.setAttribute('content', latestImage);
          if (twitterMeta) twitterMeta.setAttribute('content', latestImage);
        }
      }, 100);
    })
    .catch(() => {
      grid.innerHTML = '<p style="text-align:center;color:#666">No bookmarks loaded yet.</p>';
    });
  // Update last_updated timestamp on each render if available
  const lastUpdatedEl = document.getElementById('artilike-last-updated');
  if (lastUpdatedEl) {
    fetch('data/last_updated.txt')
      .then(r => r.text())
      .then(t => { lastUpdatedEl.textContent = `Last updated: ${t.trim()}`; })
      .catch(() => { /* ignore */});
  }
}

document.addEventListener('DOMContentLoaded', renderArtiLikeBookmarks);
