document.documentElement.classList.add('js');

    const toggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.site-nav');
    const closeMenu = () => {
      if (!toggle || !nav) return;
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    };

    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        nav.classList.toggle('is-open', open);
      });
      nav.addEventListener('click', (event) => {
        if (event.target instanceof HTMLAnchorElement) closeMenu();
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          closeMenu();
          toggle.focus();
        }
      });
    }

    const gallery = document.querySelector('[data-portrait-gallery]');
    if (gallery) {
      const slides = [...gallery.querySelectorAll('.portrait-slide')];
      const counter = gallery.querySelector('[data-portrait-counter]');
      const caption = gallery.querySelector('[data-portrait-caption]');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let current = 0;
      let timer;

      const loadSlide = async (index) => {
        const image = slides[index].querySelector('img');
        if (image.dataset.src) {
          image.src = image.dataset.src;
          delete image.dataset.src;
        }
        await image.decode();
      };
      const showSlide = async (index) => {
        const next = (index + slides.length) % slides.length;
        try {
          await loadSlide(next);
        } catch (error) {
          console.error('Unable to load portrait gallery image.', error);
          return false;
        }
        current = next;
        slides.forEach((slide, slideIndex) => {
          const active = slideIndex === current;
          slide.classList.toggle('is-active', active);
          slide.setAttribute('aria-hidden', String(!active));
          slide.setAttribute('aria-label', (slideIndex + 1) + ' of ' + slides.length);
        });
        counter.firstChild.textContent = String(current + 1).padStart(2, '0') + ' ';
        caption.textContent = slides[current].dataset.caption;
        return true;
      };
      const clearRotation = () => {
        window.clearTimeout(timer);
        timer = undefined;
      };
      const scheduleRotation = () => {
        clearRotation();
        if (reducedMotion.matches || document.hidden) return;
        timer = window.setTimeout(async () => {
          const shown = await showSlide(current + 1);
          if (shown) scheduleRotation();
        }, 6500);
      };
      document.addEventListener('visibilitychange', scheduleRotation);
      reducedMotion.addEventListener('change', scheduleRotation);
      if (!reducedMotion.matches) {
        loadSlide((current + 1) % slides.length).catch((error) => {
          console.error('Unable to preload portrait gallery image.', error);
        });
      }
      scheduleRotation();
    }

    const copyButton = document.querySelector('[data-copy-email]');
    const copyStatus = document.querySelector('[data-copy-status]');
    if (copyButton && copyStatus) {
      copyButton.addEventListener('click', async () => {
        const email = copyButton.dataset.copyEmail;
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(email);
            copied = true;
          } catch {
            copied = false;
          }
        }
        if (!copied) {
          try {
            const fallback = document.createElement('textarea');
            fallback.value = email;
            fallback.setAttribute('readonly', '');
            fallback.style.position = 'fixed';
            fallback.style.opacity = '0';
            document.body.append(fallback);
            fallback.select();
            copied = document.execCommand('copy');
            fallback.remove();
          } catch {
            copied = false;
          }
        }
        copyStatus.textContent = copied
          ? 'Email address copied.'
          : 'Copy is unavailable. Select the email address above or use the email link.';
      });
    }