// ========================================
// MANU VIDAURRE - Photography Portfolio
// ========================================

(function () {
    'use strict';

    // --- Loader ---
    const loader = document.getElementById('loader');
    if (loader) {
        window.addEventListener('load', () => {
            setTimeout(() => loader.classList.add('hidden'), 1800);
        });
    }

    // --- Custom Cursor ---
    const cursor = document.getElementById('cursor');
    if (cursor && window.matchMedia('(pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        function bindCursorHover(selector, className) {
            document.querySelectorAll(selector).forEach(function (el) {
                el.addEventListener('mouseenter', function () { cursor.classList.add(className); });
                el.addEventListener('mouseleave', function () { cursor.classList.remove(className); });
            });
        }

        // Initial bindings (more added after dynamic content loads)
        bindCursorHover('.header-name, .back-link, .header-tag, .lightbox-close, .lightbox-nav', 'shrink');
    }

    function rebindCursorOnCards() {
        if (!cursor || !window.matchMedia('(pointer: fine)').matches) return;
        document.querySelectorAll('.event-card, .photo-item').forEach(function (el) {
            el.addEventListener('mouseenter', function () { cursor.classList.add('active'); });
            el.addEventListener('mouseleave', function () { cursor.classList.remove('active'); });
        });
    }

    // --- Header scroll ---
    var header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }, { passive: true });
    }

    // --- Reveal on Scroll ---
    function observeReveals() {
        var reveals = document.querySelectorAll('.reveal:not(.visible)');
        if (!reveals.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
        reveals.forEach(function (el) { obs.observe(el); });
    }
    observeReveals();

    // --- Page Transitions ---
    var transition = document.getElementById('pageTransition');

    function navigateWithTransition(url) {
        if (!transition) { window.location.href = url; return; }
        transition.classList.add('entering');
        setTimeout(function () { window.location.href = url; }, 600);
    }

    window.addEventListener('pageshow', function () {
        if (transition) {
            transition.classList.remove('entering');
            transition.classList.add('leaving');
            setTimeout(function () {
                transition.classList.remove('leaving');
                transition.querySelectorAll('.transition-slice').forEach(function (s) {
                    s.style.transform = 'scaleY(0)';
                });
            }, 700);
        }
    });

    // --- Back link (gallery page) ---
    var backLink = document.getElementById('backLink');
    if (backLink) {
        backLink.addEventListener('click', function (e) {
            e.preventDefault();
            navigateWithTransition('/');
        });
    }

    // =============================================
    // INDEX PAGE: Load events from API
    // =============================================
    var eventsGrid = document.getElementById('eventsGrid');
    if (eventsGrid) {
        fetch('/api/events')
            .then(function (r) { return r.json(); })
            .then(function (events) {
                var html = '';
                events.forEach(function (ev, i) {
                    var num = String(i + 1).padStart(2, '0');
                    var coverSrc = ev.cover
                        ? '/cover/' + ev.slug + '/' + encodeURIComponent(ev.cover)
                        : '';
                    var coverHtml = coverSrc
                        ? '<img class="event-cover-img" src="' + coverSrc + '" alt="' + ev.name + '" loading="lazy">'
                        : '<div class="event-placeholder"></div>';

                    html += '<a href="event.html?event=' + ev.slug + '" class="event-card reveal" data-event="' + ev.slug + '">'
                        + '<div class="event-cover">' + coverHtml + '</div>'
                        + '<div class="event-info">'
                        + '<span class="event-number">' + num + '</span>'
                        + '<h2 class="event-name">' + ev.name + '</h2>'
                        + '<span class="event-count">' + ev.count + ' photos</span>'
                        + '</div></a>';
                });
                eventsGrid.innerHTML = html;

                // Fade in cover images
                eventsGrid.querySelectorAll('.event-cover-img').forEach(function (img) {
                    if (img.complete) { img.classList.add('loaded'); }
                    else { img.addEventListener('load', function () { img.classList.add('loaded'); }); }
                });

                // Bind interactions on new cards
                eventsGrid.querySelectorAll('.event-card').forEach(function (card) {
                    card.addEventListener('click', function (e) {
                        e.preventDefault();
                        navigateWithTransition(card.getAttribute('href'));
                    });
                });
                rebindCursorOnCards();
                observeReveals();
            })
            .catch(function (err) {
                console.error('Failed to load events:', err);
                eventsGrid.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:4rem;">Failed to load events.</p>';
            });
    }

    // =============================================
    // GALLERY PAGE: Load photos from API
    // =============================================
    var photoGrid = document.getElementById('photoGrid');
    var galleryTitle = document.getElementById('galleryTitle');
    var galleryCount = document.getElementById('galleryCount');
    var allPhotos = [];

    if (photoGrid && galleryTitle) {
        var params = new URLSearchParams(window.location.search);
        var eventSlug = params.get('event') || '';

        if (!eventSlug) {
            window.location.href = '/';
            return;
        }

        // Set title
        var displayName = eventSlug.replace(/(\d+)/g, ' $1').replace(/^\w/, function (c) { return c.toUpperCase(); }).trim();
        displayName = 'Event ' + (eventSlug.replace(/\D/g, '') || '');
        galleryTitle.textContent = displayName;
        document.title = displayName + ' \u2014 Manu Vidaurre';

        fetch('/api/events/' + encodeURIComponent(eventSlug))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                if (data.error) throw new Error(data.error);
                allPhotos = data.photos;
                if (galleryCount) {
                    galleryCount.textContent = allPhotos.length + ' photos';
                }

                var html = '';
                allPhotos.forEach(function (file, i) {
                    var thumbSrc = '/thumb/' + data.slug + '/' + encodeURIComponent(file);
                    html += '<div class="photo-item reveal" data-index="' + i + '">'
                        + '<img class="photo-img" src="' + thumbSrc + '" alt="Photo ' + (i + 1) + '" loading="lazy">'
                        + '</div>';
                });
                photoGrid.innerHTML = html;

                // Fade in images on load
                photoGrid.querySelectorAll('.photo-img').forEach(function (img) {
                    if (img.complete) { img.classList.add('loaded'); }
                    else { img.addEventListener('load', function () { img.classList.add('loaded'); }); }
                });

                // Bind clicks for lightbox
                photoGrid.querySelectorAll('.photo-item').forEach(function (item) {
                    item.addEventListener('click', function () {
                        openLightbox(parseInt(item.getAttribute('data-index'), 10));
                    });
                });

                rebindCursorOnCards();
                observeReveals();
            })
            .catch(function (err) {
                console.error('Failed to load photos:', err);
                photoGrid.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:4rem;">Failed to load photos.</p>';
            });
    }

    // --- Lightbox ---
    var lightbox = document.getElementById('lightbox');
    var lightboxClose = document.getElementById('lightboxClose');
    var lightboxPrev = document.getElementById('lightboxPrev');
    var lightboxNext = document.getElementById('lightboxNext');
    var lightboxCounter = document.getElementById('lightboxCounter');
    var lightboxContent = document.getElementById('lightboxContent');
    var currentIndex = 0;

    function getEventSlug() {
        var p = new URLSearchParams(window.location.search);
        return p.get('event') || '';
    }

    function openLightbox(index) {
        if (!lightbox) return;
        currentIndex = index;
        showLightboxImage();
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightbox) return;
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showLightboxImage() {
        if (!lightboxContent || !allPhotos.length) return;
        var slug = getEventSlug();
        var file = allPhotos[currentIndex];
        var src = '/photo/' + slug + '/' + encodeURIComponent(file);
        // Pre-create img and add loaded class on load
        var img = document.createElement('img');
        img.className = 'lightbox-img';
        img.alt = 'Photo ' + (currentIndex + 1);
        img.addEventListener('load', function () { img.classList.add('loaded'); });
        img.src = src;
        lightboxContent.innerHTML = '';
        lightboxContent.appendChild(img);
        if (lightboxCounter) {
            lightboxCounter.textContent = (currentIndex + 1) + ' / ' + allPhotos.length;
        }
    }

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightbox) lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });

    if (lightboxPrev) {
        lightboxPrev.addEventListener('click', function (e) {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
            showLightboxImage();
        });
    }

    if (lightboxNext) {
        lightboxNext.addEventListener('click', function (e) {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % allPhotos.length;
            showLightboxImage();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && lightboxPrev) lightboxPrev.click();
        if (e.key === 'ArrowRight' && lightboxNext) lightboxNext.click();
    });

})();
