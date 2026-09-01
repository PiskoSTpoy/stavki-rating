/* Ставки Рейтинг — 3D-сцена «Плавающие фишки» (Three.js)
   Заменяет статичные .hero-art картинки на процедурную 3D-сцену там,
   где это возможно. Никаких внешних .glb/.obj — вся геометрия и
   материалы собраны кодом в фирменной золотой палитре бренда.

   data-scene="full" (главная): скролл двигает камеру сквозь сцену,
   мышь наклоняет сцену, клик по фишке — отскок.
   data-scene="lite" (карточки БК): одна фишка/монета, лёгкое вращение
   + отклик на мышь/клик, без скролл-параллакса — дешевле по GPU.

   Откат на статичную картинку: prefers-reduced-motion, отсутствие WebGL,
   или ошибка любого рода на любом этапе — картинка просто остаётся. */
(function () {
  "use strict";

  function supports3D() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    if (!window.THREE || !supports3D()) return;

    var imgs = document.querySelectorAll(".hero-art[data-scene]");
    imgs.forEach(function (img) {
      try {
        mount(img);
      } catch (e) {
        /* тихий откат: картинка остаётся как есть */
      }
    });
  });

  function mount(img) {
    var mode = img.dataset.scene === "full" && window.innerWidth > 640 ? "full" : "lite";

    var wrap = document.createElement("div");
    wrap.className = "hero-art hero-3d";
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", img.alt || "");
    img.replaceWith(wrap);

    var THREE = window.THREE;
    var scene = new THREE.Scene();

    var camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight || 16 / 9, 0.1, 100);
    camera.position.set(0, 0, mode === "full" ? 9 : 6);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    wrap.appendChild(renderer.domElement);

    // ── свет: без env-карты чистый металл уходит в чёрный, поэтому свет
    // берёт на себя всю работу — несколько тёплых источников с разных сторон
    scene.add(new THREE.AmbientLight(0x4a4030, 1.8));
    var gold = new THREE.PointLight(0xd9a441, 18, 40);
    gold.position.set(-4, 2, 5);
    scene.add(gold);
    var gold2 = new THREE.PointLight(0xf0b95a, 12, 40);
    gold2.position.set(3, 3, 4);
    scene.add(gold2);
    var cool = new THREE.PointLight(0x8a97ab, 4, 30);
    cool.position.set(5, -3, 2);
    scene.add(cool);
    var key = new THREE.DirectionalLight(0xfff2d9, 1.6);
    key.position.set(2, 4, 6);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0xd9a441, 0.6);
    fill.position.set(-3, -2, -4);
    scene.add(fill);

    // ── материалы: metalness умеренный — без env-карты полный металл
    // (0.9+) тонет в черноте, а roughness повыше даёт мягкий блик, а не точку
    var goldMat = new THREE.MeshStandardMaterial({ color: 0xd9a441, metalness: 0.55, roughness: 0.35, emissive: 0x3a2408, emissiveIntensity: 0.4 });
    var darkMat = new THREE.MeshStandardMaterial({ color: 0x2b2318, metalness: 0.5, roughness: 0.4, emissive: 0x1a1006, emissiveIntensity: 0.3 });
    var glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe8c98a, metalness: 0.15, roughness: 0.12, transmission: 0.55, thickness: 0.4, clearcoat: 1, emissive: 0x2a1c08, emissiveIntensity: 0.25
    });

    function makeChip() {
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.28, 40), Math.random() > 0.5 ? goldMat : darkMat);
      var edge = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 12, 40), goldMat);
      edge.rotation.x = Math.PI / 2;
      g.add(body, edge);
      return g;
    }
    function makeCoin() {
      var mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.14, 32), Math.random() > 0.4 ? goldMat : glassMat);
      return mesh;
    }

    var group = new THREE.Group();
    scene.add(group);

    var pieces = [];
    var count = mode === "full" ? 7 : 1;
    for (var i = 0; i < count; i++) {
      var m = i % 2 === 0 ? makeChip() : makeCoin();
      var spread = mode === "full" ? 5 : 0;
      m.position.set((Math.random() - 0.5) * spread * 2, (Math.random() - 0.5) * spread, (Math.random() - 0.5) * 3);
      m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      m.userData.spin = (Math.random() * 0.4 + 0.15) * (Math.random() > 0.5 ? 1 : -1);
      m.userData.bobSpeed = Math.random() * 0.6 + 0.5;
      m.userData.bobPhase = Math.random() * Math.PI * 2;
      m.userData.baseY = m.position.y;
      m.userData.bounce = 0;
      group.add(m);
      pieces.push(m);
    }

    // ── интерактив: мышь наклоняет сцену
    var mouseX = 0, mouseY = 0, targetRotX = 0, targetRotY = 0;
    function onMove(e) {
      var r = wrap.getBoundingClientRect();
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      var y = e.touches ? e.touches[0].clientY : e.clientY;
      mouseX = ((x - r.left) / r.width) * 2 - 1;
      mouseY = ((y - r.top) / r.height) * 2 - 1;
      targetRotY = mouseX * 0.28;
      targetRotX = mouseY * -0.18;
    }
    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("touchmove", onMove, { passive: true });

    // ── клик по фишке — отскок
    var raycaster = new THREE.Raycaster();
    var mouseVec = new THREE.Vector2();
    function onClick(e) {
      var r = wrap.getBoundingClientRect();
      mouseVec.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouseVec.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      raycaster.setFromCamera(mouseVec, camera);
      var hit = raycaster.intersectObjects(pieces, true)[0];
      if (hit) {
        var root = hit.object;
        while (root.parent && root.parent !== group) root = root.parent;
        root.userData.bounce = 1.4;
      }
    }
    wrap.addEventListener("click", onClick);
    wrap.style.cursor = "pointer";

    // ── скролл двигает камеру сквозь сцену (только на главной)
    var heroSection = wrap.closest("main") || wrap;
    function scrollProgress() {
      var r = heroSection.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var p = 1 - (r.top + r.height * 0.4) / vh;
      return Math.max(0, Math.min(1, p));
    }

    // ── пауза рендера вне экрана
    var visible = true;
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
      }, { threshold: 0.01 });
      io.observe(wrap);
    }

    function resize() {
      var w = wrap.clientWidth, h = wrap.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    resize();
    window.addEventListener("resize", resize);

    var clock = new THREE.Clock();
    function animate() {
      requestAnimationFrame(animate);
      if (!visible) return;
      var t = clock.getElapsedTime();

      pieces.forEach(function (m) {
        m.rotation.y += 0.01 * m.userData.spin;
        m.position.y = m.userData.baseY + Math.sin(t * m.userData.bobSpeed + m.userData.bobPhase) * 0.25;
        if (m.userData.bounce > 0.01) {
          m.position.y += Math.sin(m.userData.bounce * 6) * m.userData.bounce * 0.4;
          m.userData.bounce *= 0.9;
        }
      });

      group.rotation.x += (targetRotX - group.rotation.x) * 0.06;
      group.rotation.y += (targetRotY - group.rotation.y) * 0.06;

      if (mode === "full") {
        var p = scrollProgress();
        camera.position.z = 9 - p * 5.5;
        group.rotation.y += p * 0.15;
      }

      renderer.render(scene, camera);
    }
    animate();
  }
})();
