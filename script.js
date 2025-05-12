// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM - cachear referencias para mejor rendimiento
  const loader = document.getElementById('loader');
  const heartContainer = document.querySelector('.heart-container');
  const birdsContainer = document.querySelector('.birds-container');
  const canvas = document.getElementById('canvas');
  const ctx = canvas && canvas.getContext('2d'); // Verificar que canvas existe
  const toggleMusicBtn = document.getElementById('toggleMusic');
  const toggleModeBtn = document.getElementById('toggleMode');
  const toggleHeartsBtn = document.getElementById('toggleHearts');
  
  // Verificar si todos los elementos necesarios existen
  if (!canvas || !ctx) {
    console.error("No se pudo encontrar el elemento canvas o su contexto");
    return; // Salir si no hay canvas
  }
  
  // Asegurarse de que exista un contenedor para el collage
  const collageContainer = document.getElementById('background-collage');
  if (!collageContainer) {
    console.warn("No se encontró el contenedor del collage");
  }

  // Variables globales
  let W, H;
  let leaves = [];
  let birds = []; 
  let phase = 0;
  let mouse = { x: -50, y: 0, size: 20 };
  let seed = { x: null, y: null, size: 8 };
  let treeProgress = 0;
  let nightMode = false;
  let fallingHeartsActive = true; // Activado por defecto
  let needsRedraw = true;
  let lastFrameTime = 0;
  const FPS_LIMIT = 30; // Limitar a 30 FPS para mejor rendimiento
  const FRAME_INTERVAL = 1000 / FPS_LIMIT;
  const STAR_COUNT = 40; // Reducido para mejor rendimiento
  
  // Lista de imágenes - colocar aquí las rutas correctas a tus fotos
  const imagePaths = [
    "foticos/A.jpg", "foticos/C.jpg", "foticos/E.jpg",
    "foticos/I.jpg", "foticos/MIA.jpg", "foticos/N.jpg", 
    "foticos/P.jpg", "foticos/AM.jpg", 
    "foticos/CHO.jpg", "foticos/MO.jpg", "foticos/MU.jpg", "foticos/TE.jpg"
  ];
  
  // Función para precargar imágenes - solo para el collage
  function preloadImages() {
    const preloadPromises = imagePaths.map(path => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(path);
        img.onerror = () => {
          console.warn(`No se pudo cargar la imagen: ${path}`);
          reject(path);
        };
        img.src = path;
      });
    });
    
    return Promise.allSettled(preloadPromises).then(results => {
      const loadedImages = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      return loadedImages;
    });
  }
  
  // Colores para día y noche - Paleta mejorada para más romanticismo
  const dayColors = {
    trunk: '#8B5A2B',
    branches: '#A0522D',
    background: '#FFF5F8',
    birds: '#d81b60',
    heartColors: ['#ff6b81', '#ff4d6d', '#ff758f', '#ff8fa3', '#ffb3c1', '#ff3366', '#ff0a54', '#ff477e'],
    stars: []
  };
  
  const nightColors = {
    trunk: '#5D4E60',
    branches: '#6D5E70',
    background: '#101630',
    birds: '#9198e5',
    heartColors: ['#9198e5', '#7986cb', '#5c6bc0', '#7e57c2', '#b39ddb', '#8c6bc8', '#aa80ff', '#6a5acd'],
    stars: []
  };
  
  let colors = dayColors;

  // Ocultar el loader cuando la página termine de cargar
  window.addEventListener('load', () => {
    // Precargar imágenes primero
    preloadImages().then(validImagePaths => {
      // Actualizar la lista de imágenes con solo las válidas
      if (validImagePaths.length > 0) {
        // Crear copia temporal para evitar mutar durante iteración
        const newImagePaths = [...validImagePaths];
        imagePaths.length = 0;
        newImagePaths.forEach(path => imagePaths.push(path));
        
        if (collageContainer) {
          createCollage();
        }  
      }
      
      // Ocultar el loader
      if (loader) {
        setTimeout(() => {
          loader.style.opacity = '0';
          setTimeout(() => {
            if (loader.parentNode) {
              loader.style.display = 'none';
            }
          }, 250);
        }, 300);
      }
    });
  });

  // Generar estrellas para el modo noche de manera eficiente
  function generateStars() {
    nightColors.stars = [];
    const calculatedStarCount = Math.min(Math.ceil(W * H * 0.0001), STAR_COUNT);
    
    for (let i = 0; i < calculatedStarCount; i++) {
      nightColors.stars.push({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2
      });
    }
  }

  // Función de redimensionado con debounce para mejor rendimiento
  function resize() {
    if (!canvas) return;
    
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    leaves = [];
    mouse.y = H - 50;
    seed.x = null;
    treeProgress = 0;
    phase = 0;
    
    generateStars();
    clearBirds();
    createBirds(3); // Solo crear 3 pájaros
    needsRedraw = true;
  }
  
  // Debounce para el evento resize para mejor rendimiento
  function debounce(func, wait) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), wait);
    };
  }
  
  window.addEventListener('resize', debounce(resize, 250));
  

  // Modo día/noche
  if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', () => {
      nightMode = !nightMode;
      document.body.classList.toggle('night-mode', nightMode);
      colors = nightMode ? nightColors : dayColors;
      updateBirdColors();
      needsRedraw = true;
    });
  }

  // Funciones para manejo de pájaros
  function createBirds(count) {
    if (!birdsContainer) return;
    
    for (let i = 0; i < count; i++) {
      const bird = document.createElement('div');
      bird.className = 'bird';
      bird.style.color = colors.birds;
      
      const x = Math.random() * (W - 40) + 20;
      const y = Math.random() * (H * 0.7);
      
      bird.style.left = `${x}px`;
      bird.style.top = `${y}px`;
      
      // Animación de vuelo más lenta y eficiente
      const duration = 8 + Math.random() * 8;
      const delay = Math.random() * 3;
      bird.style.animation = `birdFly ${duration}s ease-in-out ${delay}s infinite`;
      
      birdsContainer.appendChild(bird);
      birds.push(bird);
    }
  }
  
  function updateBirdColors() {
    birds.forEach(bird => bird.style.color = colors.birds);
  }
  
  function clearBirds() {
    if (!birdsContainer) return;
    birdsContainer.innerHTML = '';
    birds = [];
  }

  // Configuración del reproductor de música
  if (toggleMusicBtn) {
    toggleMusicBtn.addEventListener('click', () => {
      const spotifyContainer = document.getElementById('spotify-player-container');
      if (spotifyContainer) {
        const isVisible = spotifyContainer.style.display !== 'none';
        spotifyContainer.style.display = isVisible ? 'none' : 'block';
        toggleMusicBtn.classList.toggle('active', !isVisible);
        toggleMusicBtn.innerHTML = isVisible ? 
          '<i class="fas fa-music"></i>' : 
          '<i class="fas fa-volume-up"></i>';
      }
    });
  }
  
  function drawBranch(x, y, len, ang, depth) {
    if (!ctx) return;
    
    if (depth <= 0 || len <= 2) {
      leaves.push({ x, y });
      return;
    }

    const prog = Math.min(treeProgress * 1.2, 1);
    const currLen = len * prog;
    const x2 = x + Math.cos(ang) * currLen;
    const y2 = y - Math.sin(ang) * currLen;

    ctx.strokeStyle = depth > 3 ? colors.trunk : colors.branches;
    ctx.lineWidth = depth * 1.2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    if (prog >= (6 - depth + 1) / 6) {
      const nl = len * 0.75;
      const baseAngleVar = Math.PI / 7;
      const branchCount = 2;

      for (let i = 0; i < branchCount; i++) {
        const angleVar = (i === 0 ? -1 : 1) * baseAngleVar;
        drawBranch(x2, y2, nl, ang + angleVar, depth - 1);
      }
    }
  }

  // Dentro de la función buildTree()
  function buildTree() {
    if (!ctx) return;
    
    const startX = W / 2;
    const startY = H;
    const trunkHeight = H * 0.2; // Árbol más bajito (antes 0.28)

    ctx.strokeStyle = colors.trunk;
    ctx.lineWidth = 12 * treeProgress;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY - trunkHeight * treeProgress);
    ctx.stroke();

    if (treeProgress > 0.3) {
      const branchCount = 3; // Menos ramas (antes 5)
      const spreadAngle = 0.6; // Ángulo más cerrado

      for (let i = 0; i < branchCount; i++) {
        const angle = Math.PI/2 - spreadAngle/2 + (i / (branchCount - 1)) * spreadAngle;
        const branchLength = H * 0.18;
        drawBranch(startX, startY - trunkHeight * treeProgress, branchLength, angle, 5); // Profundidad menor
      }
    }
  }

  // Dibujar estrellas en modo noche
  function drawStars() {
    if (!ctx || !nightMode || colors.stars.length === 0) return;
    
    const pulseVal = Math.sin(Date.now() / 2000) * 0.2;
    ctx.fillStyle = 'white';
    
    colors.stars.forEach(star => {
      ctx.globalAlpha = star.opacity + pulseVal;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  }

  // Función para crear corazones que caen (sin fotos)
  function createFallingHeart() {
    if (phase !== 2 || !fallingHeartsActive || !heartContainer) return;
    
    // Usar menos hojas para mejor rendimiento
    const leafPositions = leaves.filter((_, i) => i % 20 === 0);
    if (leafPositions.length === 0) return;
    
    const randomLeaf = leafPositions[Math.floor(Math.random() * leafPositions.length)];
    const heart = document.createElement('div');
    heart.classList.add('heart', 'falling');
    
    heart.style.left = `${randomLeaf.x}px`;
    heart.style.top = `${randomLeaf.y}px`;
    
    // Seleccionar un color aleatorio del arreglo de colores según el modo
    const colorPalette = nightMode ? colors.heartColors : colors.heartColors;
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    heart.style.backgroundColor = randomColor;
    
    const size = 15 + Math.random() * 10;
    heart.style.width = `${size}px`;
    heart.style.height = `${size}px`;
    
    heart.style.opacity = 0.8 + Math.random() * 0.2;
    // Eliminar cuando termine la animación para liberar memoria
    heart.addEventListener('animationend', () => {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
    });
    
    heartContainer.appendChild(heart);
  }

  // Función que completa el árbol
  function completeTree() {
    generateLeaves();
    setTimeout(() => {
      phase = 2;
      fallingHeartsActive = true;
      // Iniciar caída periódica de corazones con menos frecuencia
      setInterval(createFallingHeart, 5000);
      
      // Generar corazones adicionales caídos con menor frecuencia
      generateFallingHearts();
    }, 1000);
  }

  // Generar corazones que caen de manera más eficiente
  function generateFallingHearts() {
    if (phase !== 2 || !fallingHeartsActive || !heartContainer) return;
    
    // Limitar la cantidad de corazones activos
    const activeHearts = document.querySelectorAll('.heart.falling');
    if (activeHearts.length > 8) {
      setTimeout(generateFallingHearts, 4000);
      return;
    }
    
    const topLeaves = leaves.filter(leaf => leaf.y < H * 0.4);
    const leavesToUse = topLeaves.length > 20 ? 
      topLeaves.filter((_, i) => i % 5 === 0) : 
      leaves.filter((_, i) => i % 40 === 0);
    
    // Máximo 3 corazones por ciclo
    const heartsToCreate = Math.min(2, leavesToUse.length);
    
    for (let i = 0; i < heartsToCreate; i++) {
      if (i >= leavesToUse.length) break; // Asegurarse de que haya suficientes hojas
      const { x, y } = leavesToUse[i];
      const heart = document.createElement('div');
      heart.classList.add('heart', 'falling');
      
      heart.style.left = `${x}px`;
      heart.style.top = `${y}px`;
      
      // Seleccionar un color aleatorio del arreglo de colores según el modo
      const colorPalette = nightMode ? colors.heartColors : colors.heartColors;
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      heart.style.backgroundColor = randomColor;
      
      const size = 10 + Math.random() * 10;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;

      // Añadir un efecto de caída aleatorio
      heart.style.animationDuration = `${3 + Math.random() * 2}s`;
      
      // Eliminar cuando termine la animación
      heart.addEventListener('animationend', () => {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      });
      
      heartContainer.appendChild(heart);
    }
    
    // Intervalo variable para más naturalidad
    setTimeout(generateFallingHearts, 3000 + Math.random() * 2000);
  }

  // Función mejorada para crear el collage
  function createCollage() {
    if (!collageContainer) {
      console.error("No se encontró el contenedor del collage");
      return;
    }

    // Limpiar el contenedor
    collageContainer.innerHTML = '';

    // Si no hay imágenes disponibles, no crear el collage
    if (imagePaths.length === 0) {
      console.warn("No hay imágenes disponibles para el collage");
      collageContainer.style.display = 'none';
      return;
    }

    console.log(`Creando collage con ${imagePaths.length} imágenes`);

    // Usar fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();

    // Distribuir imágenes en filas fijas
    imagePaths.forEach((path, index) => {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'collage-img';

      // Crear la imagen
      const img = document.createElement('img');
      img.src = path;
      img.alt = "Foto del collage";
      img.loading = "lazy"; // Carga diferida

      imgWrapper.appendChild(img);
      fragment.appendChild(imgWrapper);
    });

    // Añadir el fragmento al DOM
    collageContainer.appendChild(fragment);
    collageContainer.style.display = 'grid';
  }

  function generateLeaves() {
    if (!heartContainer) return;
    
    heartContainer.innerHTML = '';
    
    // Usar fragmento para insertar todos los corazones de una vez
    const fragment = document.createDocumentFragment();
    
    // Distribuir hojas de forma más parecida a la imagen
    const centerX = W / 2;
    const centerY = H * 0.4; // Centro de la copa más arriba
    const radiusX = W * 0.22; // Radio horizontal más amplio
    const radiusY = H * 0.28; // Radio vertical para copa redondeada
    
    // Generar hojas adicionales para mayor densidad
    const extraLeaves = [];
    
    // Crear hojas en forma circular para la copa del árbol
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      for (let r = 0; r < 0.95; r += 0.15) {
        // Coordenadas dentro de una elipse
        const x = centerX + Math.cos(angle) * radiusX * r;
        const y = centerY + Math.sin(angle) * radiusY * r;
        
        // Añadir alguna variación para más naturalidad
        const offsetX = (Math.random() - 0.5) * 15;
        const offsetY = (Math.random() - 0.5) * 15;
        
        extraLeaves.push({
          x: x + offsetX,
          y: y + offsetY
        });
      }
    }
    
    // Usar tanto las hojas generadas del árbol como las extras
    const allLeaves = [...leaves, ...extraLeaves];
    
    // Añadir algunas hojas que caen
    for (let i = 0; i < 15; i++) {
      const baseX = centerX + (Math.random() - 0.5) * radiusX * 2.2;
      const baseY = H * 0.6 + Math.random() * (H * 0.3);
      extraLeaves.push({ x: baseX, y: baseY });
    }
    
    // Filtrar para evitar corazones fuera de la pantalla
    const visibleLeaves = allLeaves.filter((leaf) => {
      return leaf.x > 0 && leaf.x < W && leaf.y > 0 && leaf.y < H;
    });

    // Limitar número total de corazones para rendimiento
    const maxHearts = 200;
    const stepSize = Math.max(1, Math.floor(visibleLeaves.length / maxHearts));
    
    if (visibleLeaves.length === 0) {
      console.warn("No hay hojas para generar corazones");
      return;
    }
    
    // Procesar solo un subconjunto de hojas si hay demasiadas
    for (let i = 0; i < visibleLeaves.length; i += stepSize) {
      const position = visibleLeaves[i];
      
      const heart = document.createElement('div');
      heart.classList.add('heart');
      
      heart.style.left = `${position.x}px`;
      heart.style.top = `${position.y}px`;
      
      // Usar la paleta de colores definida
      const colorPalette = nightMode ? colors.heartColors : colors.heartColors;
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      heart.style.backgroundColor = randomColor;
      
      // Tamaño variable según la posición
      const distFromCenter = Math.sqrt(
        Math.pow((position.x - centerX) / radiusX, 2) + 
        Math.pow((position.y - centerY) / radiusY, 2)
      );
      
      const sizeBase = 12 + Math.random() * 10;
      const size = sizeBase * (1 - 0.2 * distFromCenter);
      
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      
      // Asegurarnos de que todos los corazones tengan una animación
      if (i % 10 === 0) {
        heart.classList.add('falling');
      } else {
        heart.classList.add('permanent');
        heart.style.animationDelay = `${Math.random() * 2}s`;
      }
      
      fragment.appendChild(heart);
    }
    
    heartContainer.appendChild(fragment);
    console.log(`Generados ${Math.floor(visibleLeaves.length / stepSize)} corazones`);
  }

  // Función de animación optimizada
  function animate(timestamp) {
    if (!ctx) return;
    
    // Limitar framerate
    if (timestamp - lastFrameTime < FRAME_INTERVAL) {
      requestAnimationFrame(animate);
      return;
    }
    lastFrameTime = timestamp;
    
    // Solo redibujar cuando sea necesario
    if (needsRedraw || phase <= 1) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, W, H);
      
      if (nightMode) {
        drawStars();
      }
      
      if (phase === 0) {
        // Mover el cursor hacia el centro
        const targetX = W / 2;
        const dx = targetX - mouse.x;
        mouse.x += dx * 0.05;
        mouse.y = H - 50;
    
        // Dibujar indicador de inicio
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
          }, 300);
        }
    
        if (seed.x !== null) {
          ctx.beginPath();
          ctx.arc(seed.x, seed.y, seed.size, 0, 2 * Math.PI);
          ctx.fillStyle = colors.trunk;
          ctx.fill();
        }
      } else if (phase === 1) {
        // Crecimiento del árbol
        treeProgress = Math.min(treeProgress + 0.02, 1);
        buildTree();
    
        if (treeProgress >= 1) {
          // Importante: Asegurarnos de que hay hojas antes de completar el árbol
          if (leaves.length > 0) {
            console.log(`Árbol completado con ${leaves.length} hojas`);
            completeTree();
          } else {
            console.warn("El árbol no tiene hojas para generar corazones");
            // Intentar generar algunas hojas manualmente
            for (let i = 0; i < 50; i++) {
              leaves.push({
                x: W/2 + (Math.random() * 100 - 50),
                y: H/2 + (Math.random() * 50 - 100)
              });
            }
            completeTree();
          }
        }
      } else {
        // Árbol completo
        buildTree();
        needsRedraw = false; // No necesitamos redibujar constantemente en fase 2
      }
    }
    
    requestAnimationFrame(animate);
  }

  // Temporizador optimizado
  function startTimer() {
    // Fecha real a establecer (14 de abril de 2023)
    const startDate = new Date('2025-04-14T00:00:00');
    const timerElement = document.getElementById('timer');
    const progressBar = document.querySelector('.progress');
    
    if (!timerElement || !progressBar) return;
    
    // Actualizar cada segundo
    const updateTimer = () => {
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
    };
    
    // Actualizar inmediatamente y luego cada segundo
    updateTimer();
    setInterval(updateTimer, 1000);
  }
  
  // FORZAR INICIO INMEDIATO DEL ÁRBOL
  function forceStartTree() {
    console.log("Iniciando árbol forzadamente");
    seed.x = W / 2;
    seed.y = H - 50;
    phase = 1;
    treeProgress = 0;
    leaves = [];
    needsRedraw = true;
  }
  
  // Para depuración: hacer crecer el árbol rápidamente
  function quickGrowTree() {
    treeProgress = 1;
    buildTree();
    if (leaves.length > 0) {
      completeTree();
    } else {
      console.warn("No hay hojas generadas para completar el árbol");
    }
  }
  
  // Verificar si hay problemas después de 2 segundos
  setTimeout(() => {
    if (phase === 0) {
      console.log("Iniciando árbol automáticamente");
      forceStartTree();
      // Crecer rápidamente después de otro segundo
      setTimeout(() => {
        quickGrowTree();
      }, 1000);
    }
  }, 2000);

  // Configurar botón para activar/desactivar corazones que caen
  if (toggleHeartsBtn) {
    toggleHeartsBtn.addEventListener('click', () => {
      fallingHeartsActive = !fallingHeartsActive;
      toggleHeartsBtn.classList.toggle('active', fallingHeartsActive);
    
      if (fallingHeartsActive) {
        // Generar algunos corazones inmediatamente al activar
        for (let i = 0; i < 5; i++) {
          setTimeout(() => createFallingHeart(), i * 300);
        }
        // Reiniciar el intervalo
        setTimeout(generateFallingHearts, 2000);
      }
    });
  
    // Activar por defecto
    toggleHeartsBtn.classList.add('active');
  }

  // Inicializar
  resize(); // Inicializar tamaños
  startTimer();
  preloadImages().then(validImagePaths => {
    // Actualizar la lista de imágenes con solo las válidas
    if (validImagePaths.length > 0) {
      // Crear copia temporal para evitar mutar durante iteración
      const newImagePaths = [...validImagePaths];
      imagePaths.length = 0;
      newImagePaths.forEach(path => imagePaths.push(path));
      
      if (collageContainer) {
        createCollage();
      }
    } else {
      // Si no hay imágenes, esconder el collage
      if (collageContainer) {
        collageContainer.style.display = 'none';
      }
    }
    
    // Iniciar la animación del árbol
    requestAnimationFrame(animate);
  });
});