// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM
  const loader = document.getElementById('loader');
  const heartContainer = document.querySelector('.heart-container');
  const birdsContainer = document.querySelector('.birds-container');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const toggleMusicBtn = document.getElementById('toggleMusic');
  const toggleModeBtn = document.getElementById('toggleMode');
  const collageContainer = document.getElementById('background-collage');

  // Variables globales - reduciendo la complejidad
  let W, H;
  let leaves = [];
  let permanentHearts = [];
  let birds = []; 
  let phase = 0;
  let mouse = { x: -50, y: 0, size: 20 };
  let seed = { x: null, y: null, size: 8 };
  let treeProgress = 0;
  let nightMode = false;
  
  // Reducir cantidad de estrellas para mejorar rendimiento
  const STAR_COUNT = 50; // Reducido de 100

  // Ocultar el loader apenas esté disponible
  window.addEventListener('load', () => {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 300); // Reducido de 500
  });

  // Configuración del reproductor de Spotify
  toggleMusicBtn.addEventListener('click', () => {
    const spotifyContainer = document.getElementById('spotify-player-container');
    if (spotifyContainer) {
      if (spotifyContainer.style.display === 'none') {
        spotifyContainer.style.display = 'block';
        toggleMusicBtn.classList.add('active');
        toggleMusicBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      } else {
        spotifyContainer.style.display = 'none';
        toggleMusicBtn.classList.remove('active');
        toggleMusicBtn.innerHTML = '<i class="fas fa-music"></i>';
      }
    }
  });
  
  // Colores para día y noche
  const dayColors = {
    trunk: '#8B5A2B',
    branches: '#A0522D',
    background: '#FFF5F8',
    birds: '#d81b60',
    stars: []
  };
  
  const nightColors = {
    trunk: '#5D4E60',
    branches: '#6D5E70',
    background: '#101630',
    birds: '#9198e5',
    stars: []
  };
  
  let colors = dayColors;

  // Generación de estrellas para el modo noche - optimizada
  function generateStars() {
    nightColors.stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      nightColors.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
  }

  // Redimensionado
  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    leaves = [];
    permanentHearts = [];
    mouse.y = H - 50;
    seed.x = null;
    treeProgress = 0;
    phase = 0;
    
    generateStars();
    
    // Limpiar pájaros
    birds = [];
    clearBirds();
  }
  
  // Debounce para el evento resize para mejor rendimiento
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 250);
  });
  
  resize();

  // Modo día/noche
  toggleModeBtn.addEventListener('click', () => {
    nightMode = !nightMode;
    document.body.classList.toggle('night-mode', nightMode);
    
    if (nightMode) {
      colors = nightColors;
      toggleModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      colors = dayColors;
      toggleModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    updateBirdColors();
  });

  // Collage de imágenes reducido a 4 imágenes
  function createCollage() {
    // Reducido a 4 imágenes
    const imagePaths = [
      "/api/placeholder/200/150",
      "/api/placeholder/200/150",
      "/api/placeholder/200/150",
      "/api/placeholder/200/150"
    ];
    
    // Limpiar collage existente
    collageContainer.innerHTML = '';
    
    // Crear elementos para cada imagen
    imagePaths.forEach((path, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'collage-img';
      
      const img = document.createElement('img');
      img.src = path;
      img.alt = "Foto de nosotros";
      
      // Posición simplificada
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      imgWrapper.style.left = `${col * 50 + 5}%`;
      imgWrapper.style.top = `${row * 50 + 5}%`;
      imgWrapper.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
      
      imgWrapper.appendChild(img);
      collageContainer.appendChild(imgWrapper);
    });
  }
  
  // Creación optimizada con menos pájaros
  function createBird() {
    const bird = document.createElement('div');
    bird.className = 'bird';
    bird.style.color = colors.birds;
    
    const x = Math.random() * (W - 40) + 20;
    const y = Math.random() * (H * 0.7);
    
    bird.style.left = `${x}px`;
    bird.style.top = `${y}px`;
    
    // Animación de vuelo más lenta
    const duration = 8 + Math.random() * 8;
    const delay = Math.random() * 3;
    bird.style.animation = `birdFly ${duration}s ease-in-out ${delay}s infinite`;
    
    birdsContainer.appendChild(bird);
    birds.push(bird);
    
    return bird;
  }
  
  function updateBirdColors() {
    birds.forEach(bird => {
      bird.style.color = colors.birds;
    });
  }
  
  function clearBirds() {
    birdsContainer.innerHTML = '';
    birds = [];
  }
  
  // Crear solo 3 pájaros en lugar de 5
  for (let i = 0; i < 3; i++) {
    createBird();
  }

  // Dibujo de ramas optimizado
  function drawBranch(x, y, len, ang, depth) {
    if (depth === 0) {
      leaves.push({ x, y });
      return;
    }
    
    const prog = Math.min(treeProgress * 1.2, 1);
    const currLen = len * prog;
    const x2 = x + Math.cos(ang) * currLen;
    const y2 = y - Math.sin(ang) * currLen;

    ctx.save();
    const color = depth > 6 ? colors.trunk : colors.branches;
    ctx.strokeStyle = color;
    ctx.lineWidth = depth * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();

    // Solo dibujamos si progreso suficiente y limitamos profundidad recursiva
    if (prog >= (9 - depth + 1) / 9) {
      const nl = len * 0.7;
      drawBranch(x2, y2, nl, ang - Math.PI / 10, depth - 1);
      drawBranch(x2, y2, nl, ang + Math.PI / 10, depth - 1);
    }
  }

  function buildTree() {
    // Centro el árbol horizontalmente
    drawBranch(W / 2, H, 90, Math.PI / 2, 9);
  }

  function generateLeaves() {
    // Limpiar corazones existentes
    heartContainer.innerHTML = '';
    permanentHearts = [];
    
    // Reducir número de hojas procesadas
    const processLeaves = leaves.filter((_, i) => i % 2 === 0); // Procesar solo la mitad
    
    processLeaves.forEach(({ x, y }, index) => {
      const heart = document.createElement('div');
      heart.classList.add('heart');
      
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;

      const hueOptions = [340, 350, 360, 0, 10, 20];
      const hue = hueOptions[Math.floor(Math.random() * hueOptions.length)];
      const sat = 70 + Math.random() * 30;
      const light = nightMode ? 55 + Math.random() * 30 : 45 + Math.random() * 30;
      heart.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
      
      const size = 8 + Math.random() * 8;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      
      if (index % 3 === 0) {
        heart.classList.add('permanent');
        permanentHearts.push(heart);
      } else {
        heart.classList.add('falling');
        heart.style.animationDelay = `${Math.random() * 0.5}s`;
      }
      
      heartContainer.appendChild(heart);
    });
  }

  // Reducir frecuencia de corazones que caen
  let fallingHeartsActive = false;
  function generateMoreFallingHearts() {
    if (phase === 2 && fallingHeartsActive) {
      const leavesToUse = leaves.filter((_, i) => i % 15 === 0); // Usar muchos menos
      
      leavesToUse.forEach(({ x, y }) => {
        const heart = document.createElement('div');
        heart.classList.add('heart', 'falling');
        
        heart.style.left = `${x}px`;
        heart.style.top = `${y}px`;
        
        const hueOptions = [340, 350, 360, 0, 10, 20];
        const hue = hueOptions[Math.floor(Math.random() * hueOptions.length)];
        const sat = 70 + Math.random() * 30;
        const light = nightMode ? 55 + Math.random() * 30 : 45 + Math.random() * 30;
        heart.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
        
        const size = 8 + Math.random() * 8;
        heart.style.width = `${size}px`;
        heart.style.height = `${size}px`;
        
        heartContainer.appendChild(heart);
        
        // Eliminar después de la animación
        setTimeout(() => {
          if (heart.parentNode) {
            heart.parentNode.removeChild(heart);
          }
        }, 3000);
      });
      
      // Programar la próxima generación con más retraso
      setTimeout(generateMoreFallingHearts, 3000);
    }
  }

  // Dibujo de estrellas optimizado
  function drawStars() {
    if (nightMode && colors.stars.length > 0) {
      // Actualizamos la pulsación cada 100ms en lugar de constantemente
      const pulseVal = Math.sin(Date.now() / 2000) * 0.2;
      
      ctx.beginPath();
      colors.stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity + pulseVal})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // Controlar el frame rate para mejorar rendimiento
  let lastFrameTime = 0;
  const FPS_TARGET = 30;
  const FRAME_INTERVAL = 1000 / FPS_TARGET;

  function animate(timestamp) {
    // Limitar framerate
    if (timestamp - lastFrameTime < FRAME_INTERVAL) {
      requestAnimationFrame(animate);
      return;
    }
    lastFrameTime = timestamp;
    
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, W, H);
    
    // Dibujar estrellas en modo noche
    drawStars();

    if (phase === 0) {
      const targetX = W / 2;
      const dx = targetX - mouse.x;
      mouse.x += dx * 0.02;
      mouse.y = H - 50;

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.size, 0, 2 * Math.PI);
      ctx.fillStyle = colors.trunk;
      ctx.fill();

      if (seed.x === null && Math.abs(dx) < 2) {
        seed.x = mouse.x;
        seed.y = mouse.y;
        setTimeout(() => {
          phase = 1;
          treeProgress = 0;
          leaves = [];
        }, 500);
      }

      if (seed.x !== null) {
        ctx.beginPath();
        ctx.arc(seed.x, seed.y, seed.size, 0, 2 * Math.PI);
        ctx.fillStyle = colors.trunk;
        ctx.fill();
      }
    } else if (phase === 1) {
      // Aumentar velocidad para que termine más rápido
      treeProgress = Math.min(treeProgress + 0.015, 1);
      buildTree();

      if (treeProgress === 1 && leaves.length > 0) {
        generateLeaves();
        setTimeout(() => {
          phase = 2;
          fallingHeartsActive = true;
          generateMoreFallingHearts();
        }, 1000);
      }
    } else if (phase === 2) {
      buildTree();
    }

    // Continuar la animación
    requestAnimationFrame(animate);
  }

  // Función para el temporizador
  function startTimer() {
    // Fecha de inicio del amor
    const startDate = new Date('2025-04-14T00:00:00'); // Reemplazar con tu fecha
    const timerElement = document.getElementById('timer');
    const progressBar = document.querySelector('.progress');
    
    // Actualizar cada segundo
    setInterval(() => {
      const now = new Date();
      const diff = now - startDate;
      
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      timerElement.textContent = `${days} días ${hours} horas ${minutes} minutos ${seconds} segundos`;
      
      const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
      const progressPercentage = Math.min((diff / oneYearInMs) * 100, 100);
      progressBar.style.width = `${progressPercentage}%`;
    }, 1000);
  }

  // Iniciar temporizador
  startTimer();
  
  // Crear collage optimizado
  createCollage();
  
  // Iniciar animación
  requestAnimationFrame(animate);
});
// Estas son optimizaciones adicionales que puedes aplicar al script.js

// 1. Optimización de animaciones con requestAnimationFrame
function animate(timestamp) {
  // Limitar framerate
  if (timestamp - lastFrameTime < FRAME_INTERVAL) {
    requestAnimationFrame(animate);
    return;
  }
  lastFrameTime = timestamp;
  
  // Aplicar el patrón de renderización condicional
  // Solo redibujar el fondo cuando sea necesario
  if (needsBackgroundRedraw) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, W, H);
    needsBackgroundRedraw = false;
  }
  
  // Dibujar estrellas en modo noche solo cuando sea necesario
  if (nightMode && colors.stars.length > 0 && timestamp - lastStarsUpdate > 100) {
    drawStars();
    lastStarsUpdate = timestamp;
  }

  // Resto del código de animación...
  
  // Solicitar el próximo frame
  requestAnimationFrame(animate);
}

// 2. Optimización del manejo de eventos - Debouncing para eventos de resize y scroll
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

const debouncedResize = debounce(resize, 250);
window.addEventListener('resize', debouncedResize);

// 3. Lazy loading para los elementos visuales menos críticos
function lazyLoadVisuals() {
  // Cargar solo cuando sea visible o después de un tiempo
  setTimeout(() => {
    if (!visualsLoaded) {
      createCollage();
      for (let i = 0; i < 3; i++) {
        createBird();
      }
      visualsLoaded = true;
    }
  }, 1000);
}

// 4. Mejor gestión de memoria para corazones que caen
function generateMoreFallingHearts() {
  if (phase === 2 && fallingHeartsActive) {
    // Limitar la cantidad de corazones activos
    const activeHearts = document.querySelectorAll('.heart.falling');
    if (activeHearts.length > 20) {
      // Si hay demasiados corazones, esperar antes de crear más
      setTimeout(generateMoreFallingHearts, 1000);
      return;
    }
    
    // Usar solo un subconjunto de posiciones para los corazones
    const leavesToUse = leaves.filter((_, i) => i % 15 === 0);
    
    // Limitar a máximo 5 corazones por ciclo
    const heartsToCreate = Math.min(5, leavesToUse.length);
    
    for (let i = 0; i < heartsToCreate; i++) {
      const { x, y } = leavesToUse[i];
      const heart = document.createElement('div');
      heart.classList.add('heart', 'falling');
      
      // Configurar el corazón...
      
      // Eliminar el corazón cuando termine la animación para liberar memoria
      heart.addEventListener('animationend', () => {
        if (heart.parentNode) {
          heart.parentNode.removeChild(heart);
        }
      });
      
      heartContainer.appendChild(heart);
    }
    
    // Programar el siguiente ciclo
    setTimeout(generateMoreFallingHearts, 3000);
  }
}

// 5. Optimizar la generación de estrellas (para modo noche)
function generateStars() {
  nightColors.stars = [];
  
  // Usar una cantidad dinámica de estrellas según el tamaño de la pantalla
  const starDensity = 0.0001; // Estrellas por píxel
  const calculatedStarCount = Math.min(
    Math.ceil(W * H * starDensity),
    STAR_COUNT
  );
  
  for (let i = 0; i < calculatedStarCount; i++) {
    nightColors.stars.push({
      x: Math.random() * W,
      y: Math.random() * H * 0.7,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    });
  }
}

// 6. Optimizar la manipulación del DOM para la generación de hojas
function generateLeaves() {
  // Crear un fragmento de documento para insertar todos los corazones de una vez
  const fragment = document.createDocumentFragment();
  heartContainer.innerHTML = '';
  permanentHearts = [];
  
  // Procesar solo un subconjunto de hojas
  const processLeaves = leaves.filter((_, i) => i % 2 === 0);
  
  processLeaves.forEach(({ x, y }, index) => {
    const heart = document.createElement('div');
    heart.classList.add('heart');
    
    // Resto del código...
    
    fragment.appendChild(heart);
    
    if (index % 3 === 0) {
      heart.classList.add('permanent');
      permanentHearts.push(heart);
    } else {
      heart.classList.add('falling');
    }
  });
  
  // Añadir todos los corazones al DOM de una vez
  heartContainer.appendChild(fragment);
}