/* =========================================================
   Monetix Digital — scripts de la web
   Sin dependencias externas.
   ========================================================= */
(function () {
  'use strict';

  var euro = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    // Sin esto, el español no agrupa los números de cuatro cifras (6300 en vez
    // de 6.300) y la columna de resultados queda descuadrada.
    useGrouping: 'always'
  });

  /* ---------- Año del pie ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Cabecera con sombra al hacer scroll ---------- */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Menú móvil ---------- */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menú');
      document.body.classList.remove('nav-open');
    };

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('nav-open', open);
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) closeNav();
    });
  }

  /* ---------- Simulador de honorarios ---------- */
  var calc = document.getElementById('calc');
  if (calc) {
    var facturacion = document.getElementById('facturacion');
    var facturacionRange = document.getElementById('facturacionRange');
    var crecimiento = document.getElementById('crecimiento');
    var crecimientoOut = document.getElementById('crecimientoOut');
    var outIncremento = document.getElementById('outIncremento');
    var outFee = document.getElementById('outFee');
    var outNeto = document.getElementById('outNeto');
    var outAnual = document.getElementById('outAnual');

    var FEE = 0.30;

    var clamp = function (value, min, max) {
      return Math.min(Math.max(value, min), max);
    };

    var render = function () {
      var base = parseFloat(facturacion.value);
      if (!isFinite(base) || base <= 0) base = 0;

      var pct = parseFloat(crecimiento.value) || 0;
      var incremento = base * (pct / 100);
      var fee = incremento * FEE;
      var neto = incremento - fee;

      crecimientoOut.textContent = pct + '%';
      outIncremento.textContent = euro.format(incremento);
      outFee.textContent = euro.format(fee);
      outNeto.textContent = euro.format(neto);
      outAnual.textContent = euro.format(neto * 12);
    };

    // El campo numérico y el deslizador se mantienen sincronizados.
    facturacion.addEventListener('input', function () {
      var v = parseFloat(facturacion.value);
      if (isFinite(v)) {
        facturacionRange.value = clamp(
          v,
          parseFloat(facturacionRange.min),
          parseFloat(facturacionRange.max)
        );
      }
      render();
    });

    facturacion.addEventListener('blur', function () {
      var v = parseFloat(facturacion.value);
      if (!isFinite(v) || v < parseFloat(facturacion.min)) {
        facturacion.value = facturacion.min;
        facturacionRange.value = facturacionRange.min;
        render();
      }
    });

    facturacionRange.addEventListener('input', function () {
      facturacion.value = facturacionRange.value;
      render();
    });

    crecimiento.addEventListener('input', render);

    render();
  }

  /* ---------- Formulario de contacto ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var submitBtn = document.getElementById('submitBtn');
    var MAIL = 'hola@monetixdigital.com';

    var setStatus = function (message, type) {
      status.textContent = message;
      status.className = 'form__status' + (type ? ' is-' + type : '');
    };

    // Al escribir, quitamos la marca de error del campo.
    form.addEventListener('input', function (e) {
      if (e.target.classList) e.target.classList.remove('is-invalid');
    });

    var validate = function () {
      var invalid = [];
      var required = form.querySelectorAll('[required]');

      Array.prototype.forEach.call(required, function (el) {
        var ok = el.type === 'checkbox' ? el.checked : el.value.trim() !== '';
        if (ok && el.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (!ok) {
          invalid.push(el);
          el.classList.add('is-invalid');
        }
      });

      return invalid;
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var invalid = validate();
      if (invalid.length) {
        setStatus('Revisa los campos marcados antes de enviar.', 'error');
        invalid[0].focus();
        return;
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Enviando…';
      setStatus('', '');

      fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (res) {
          if (!res.ok || !res.data.ok) {
            throw new Error(res.data && res.data.error ? res.data.error : 'error');
          }
          form.reset();
          setStatus(
            '¡Gracias! Hemos recibido tu solicitud. Te respondemos en menos de 24 horas laborables.',
            'ok'
          );
        })
        .catch(function () {
          // Si el envío falla, no perdemos el contacto: se ofrece el correo directo.
          setStatus(
            'No hemos podido enviar el formulario. Escríbenos directamente a ' + MAIL + '.',
            'error'
          );
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }

  /* ---------- Animación de entrada ---------- */
  var revealables = document.querySelectorAll(
    '.step, .card, .fit__col, .tl, .hero__card, .strip__item, .note, .faq details'
  );

  if ('IntersectionObserver' in window && revealables.length) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    Array.prototype.forEach.call(revealables, function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      observer.observe(el);
    });
  }
})();
