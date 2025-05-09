// Inicialización al cargar la página
window.addEventListener('DOMContentLoaded', () => {
  // Elementos DOM - cachear referencias para mejor rendimiento
  const loader = document.getElementById('loader');
  const heartContainer = document.querySelector('.heart-container');
  const birdsContainer = document.querySelector('.birds-container');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const toggleMusicBtn = document.getElementById('toggleMusic');
  const toggleModeBtn = document.getElementById('toggleMode');
  const collageContainer = document.getElementById('background-collage');

  // Variables globales
  let W, H;
  let leaves = [];
  let birds = []; 
  let phase = 0;
  let mouse = { x: -50, y: 0, size: 20 };
  let seed = { x: null, y: null, size: 8 };
  let treeProgress = 0;
  let nightMode = false;
  let fallingHeartsActive = false;
  let needsRedraw = true;
  let lastFrameTime = 0;
  const FPS_LIMIT = 30; // Limitar a 30 FPS para mejor rendimiento
  const FRAME_INTERVAL = 1000 / FPS_LIMIT;
  const STAR_COUNT = 40; // Reducido para mejor rendimiento
  
  // Lista de imágenes - colocar aquí las rutas correctas a tus fotos
  const imagePaths = [
    "foticos/A.jpg", "foticos/C.jpg", "foticos/E.jpg",
    "foticos/I.jpg", "foticos/MIA.jpg", "foticos/N.jpg", 
    "foticos/P.jpg", "foticos/R.jpg", "foticos/S.jpg"
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
        imagePaths.length = 0;
        validImagePaths.forEach(path => imagePaths.push(path));
      }
      
      // Ocultar el loader
      setTimeout(() => {
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 250);
      }, 300);
    });
  });

  // Configuración del reproductor de música
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
  resize();

  // Modo día/noche
  toggleModeBtn.addEventListener('click', () => {
    nightMode = !nightMode;
    document.body.classList.toggle('night-mode', nightMode);
    colors = nightMode ? nightColors : dayColors;
    updateBirdColors();
    needsRedraw = true;
  });

  // Funciones para manejo de pájaros
  function createBirds(count) {
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
    birdsContainer.innerHTML = '';
    birds = [];
  }
  
  // Crear pájaros iniciales
  createBirds(3);

  // Función de dibujo de ramas optimizada
  function drawBranch(x, y, len, ang, depth) {
    if (depth <= 0 || len <= 2) {
      leaves.push({ x, y });
      return;
    }
    
    const prog = Math.min(treeProgress * 1.2, 1);
    const currLen = len * prog;
    const x2 = x + Math.cos(ang) * currLen;
    const y2 = y - Math.sin(ang) * currLen;

    // Dibujar solo si está en la pantalla
    if (x2 > -10 && x2 < W + 10 && y2 > -10 && y2 < H + 10) {
      ctx.strokeStyle = depth > 6 ? colors.trunk : colors.branches;
      ctx.lineWidth = depth * 1.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Solo seguir dibujando si estamos en el progreso adecuado
    if (prog >= (9 - depth + 1) / 9) {
      const nl = len * 0.75;
      const angleVar = Math.PI / (8 + Math.random() * 2);
      
      // Solo dibujar ramas si son visibles (profundidad no muy alta)
      if (depth > 1) {
        drawBranch(x2, y2, nl, ang - angleVar, depth - 1);
        drawBranch(x2, y2, nl, ang + angleVar, depth - 1);
      }
      
      // Añadir rama extra en el medio solo para ramas principales
      if (depth > 6 && Math.random() > 0.7) {
        drawBranch(x2, y2, nl * 0.85, ang, depth - 1);
      }
    }
  }

  // Función para construir el árbol más eficiente
  function buildTree() {
    const startX = W / 2;
    const startY = H;
    const trunkHeight = H * 0.2; // Altura proporcional a la altura del canvas
    
    // Dibujar tronco principal
    ctx.strokeStyle = colors.trunk;
    ctx.lineWidth = 12 * treeProgress;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX, startY - trunkHeight * treeProgress);
    ctx.stroke();
    
    // Dibujar ramas principales desde el tronco
    if (treeProgress > 0.3) {
      const branchCount = 3;
      for (let i = 0; i < branchCount; i++) {
        const angle = Math.PI/2 - 0.2 + (i - branchCount/2 + 0.5) * 0.3;
        drawBranch(
          startX, 
          startY - trunkHeight * treeProgress, 
          H * 0.18, // Tamaño proporcional 
          angle, 
          7 // Profundidad reducida para mejor rendimiento
        );
      }
    }
  }

  // Dibujar estrellas en modo noche
  function drawStars() {
    if (!nightMode || colors.stars.length === 0) return;
    
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
    if (phase !== 2 || !fallingHeartsActive) return;
    
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
    if (phase !== 2 || !fallingHeartsActive) return;
    
    // Limitar la cantidad de corazones activos
    const activeHearts = document.querySelectorAll('.heart.falling');
    if (activeHearts.length > 10) {
      setTimeout(generateFallingHearts, 4000);
      return;
    }
    
    // Usar muchas menos hojas
    const leavesToUse = leaves.filter((_, i) => i % 40 === 0);
    
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
      
      const size = 8 + Math.random() * 8;
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      
      // Eliminar cuando termine la animación
      heart.addEventListener('animationend', () => {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      });
      
      heartContainer.appendChild(heart);
    }
    
    // Aumentar el intervalo para menor frecuencia
    setTimeout(generateFallingHearts, 5000);
  }

  // Crear collage de fotos organizado
  function createCollage() {
    collageContainer.innerHTML = '';
    
    // Si no hay imágenes disponibles, no crear el collage
    if (imagePaths.length === 0) {
      collageContainer.style.display = 'none';
      return;
    }
    
    // Usar fragmento para mejor rendimiento
    const fragment = document.createDocumentFragment();
    
    // Función para crear un elemento de collage mejorado
    function createCollageItem(path, index) {
      const imgWrapper = document.createElement('div');
      imgWrapper.className = 'collage-img';
      
      // Añadir variación en la rotación y escala para más estética
      const rotation = Math.random() * 10 - 5; // -5 a 5 grados
      const scale = 0.95 + Math.random() * 0.1; // 0.95 a 1.05
      
      imgWrapper.style.transform = `rotate(${rotation}deg) scale(${scale})`;
      
      // Añadir bordes con diferentes grosores para variedad
      const borderWidth = 3 + Math.floor(Math.random() * 3); // 3px a 5px
      imgWrapper.style.borderWidth = `${borderWidth}px`;
      
      const img = document.createElement('img');
      img.src = path;
      img.alt = "Foto de nosotros";
      img.loading = "lazy"; // Cargar imágenes más eficientemente
      
      imgWrapper.appendChild(img);
      return imgWrapper;
    }
    
    // Verificar cada imagen antes de añadirla
    let loadedCount = 0;
    const totalImages = imagePaths.length;
    
    imagePaths.forEach((path, index) => {
      const tempImg = new Image();
      tempImg.onload = () => {
        fragment.appendChild(createCollageItem(path, index));
        loadedCount++;
        
        // Si todas las imágenes están cargadas, añadir el fragmento al DOM
        if (loadedCount === totalImages) {
          collageContainer.appendChild(fragment);
        }
      };
      
      tempImg.onerror = () => {
        console.warn(`No se pudo cargar la imagen para el collage: ${path}`);
        loadedCount++;
        
        // Si todas las imágenes están procesadas, añadir el fragmento al DOM
        if (loadedCount === totalImages) {
          collageContainer.appendChild(fragment);
        }
      };
      
      tempImg.src = path;
    });
  }

  // Generar hojas (corazones) en el árbol
  function generateLeaves() {
    heartContainer.innerHTML = '';
    
    // Usar fragmento para insertar todos los corazones de una vez
    const fragment = document.createDocumentFragment();
    
    // Solo procesar un subconjunto de hojas para mejor rendimiento, pero más que antes
    const visibleLeaves = leaves.filter((_, i) => i % 1 === 0);
    
    if (visibleLeaves.length === 0) {
      console.warn("No hay hojas para generar corazones");
      return;
    }
    
    visibleLeaves.forEach((position, index) => {
      const heart = document.createElement('div');
      heart.classList.add('heart');
      
      heart.style.left = `${position.x}px`;
      heart.style.top = `${position.y}px`;
      
      // Usar la paleta de colores definida
      const colorPalette = nightMode ? colors.heartColors : colors.heartColors;
      const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      heart.style.backgroundColor = randomColor;
      
      // Tamaños variados para más dinamismo
      const size = 8 + Math.random() * 8; // Corazones un poco más grandes
      heart.style.width = `${size}px`;
      heart.style.height = `${size}px`;
      
      // Asegurarnos de que todos los corazones tengan una animación
      if (index % 4 === 2) {
        heart.classList.add('permanent');
      } else {
        heart.classList.add('falling');
      }
      
      fragment.appendChild(heart);
    });
    
    heartContainer.appendChild(fragment);
    
    // Verificar si se generaron los corazones
    console.log(`Generados ${visibleLeaves.length} corazones`);
  }

  // Función de animación optimizada
  function animate(timestamp) {
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
    const startDate = new Date('2023-04-14T00:00:00');
    const timerElement = document.getElementById('timer');
    const progressBar = document.querySelector('.progress');
    
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
  
  // FORZAR INICIO INMEDIATO DEL ÁRBOL (para depuración)
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
  
  // Inicializar
  startTimer();
  preloadImages().then(validImagePaths => {
    // Actualizar la lista de imágenes con solo las válidas
    if (validImagePaths.length > 0) {
      imagePaths.length = 0;
      validImagePaths.forEach(path => imagePaths.push(path));
      createCollage();
    } else {
      // Si no hay imágenes, esconder el collage
      collageContainer.style.display = 'none';
    }
    
    // Iniciar la animación del árbol
    requestAnimationFrame(animate);
  });
});