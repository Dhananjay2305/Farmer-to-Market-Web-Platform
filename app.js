// Main App JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Mobile navbar toggle
    const navbarToggle = document.querySelector('.navbar__toggle');
    const navbarLinks = document.querySelector('.navbar__links');

    if (navbarToggle) {
        navbarToggle.addEventListener('click', () => {
            navbarLinks.classList.toggle('open');
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Update navbar based on auth status
    updateNavbar();
});

// Update navbar based on authentication
function updateNavbar() {
    const navActions = document.querySelector('.navbar__actions');
    if (!navActions) return;

    const user = getUser ? getUser() : null;

    if (user) {
        navActions.innerHTML = `
            <span style="color: var(--gray-600); margin-right: 1rem;">
                Hello, ${user.name.split(' ')[0]}
            </span>
            <a href="${user.role === 'farmer' ? 'farmer-dashboard.html' : 'buyer-dashboard.html'}" class="btn btn--primary">
                Dashboard
            </a>
        `;
    }
}

// Intersection Observer for animations (optional enhancement)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe elements with fade-in animation
document.querySelectorAll('.feature-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
});
