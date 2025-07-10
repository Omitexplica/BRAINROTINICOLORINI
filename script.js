
class ColoringApp {
  constructor() {
    this.images = [
      'attached_assets/Delfines_juguetones_en_la_playa-removebg-preview_1752151582168.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.36-removebg-preview_1752151582170.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.36__1_-removebg-preview_1752151582171.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37-removebg-preview_1752151582171.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37__3_-removebg-preview_1752151582172.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37__4_-removebg-preview_1752151582173.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37__5_-removebg-preview_1752151582174.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37__6_-removebg-preview_1752151582174.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.37__7_-removebg-preview_1752151582175.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.38-removebg-preview_1752151582176.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.38__1_-removebg-preview_1752151582177.png',
      'attached_assets/WhatsApp_Image_2025-07-10_at_01.51.38__2_-removebg-preview_1752151582178.png'
    ];
    
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.currentColor = '#ff6b6b';
    this.currentSize = 2;
    this.isEraser = false;
    this.drawingHistory = [];
    this.currentHistoryStep = -1;
    this.lastX = 0;
    this.lastY = 0;
    
    this.colors = [
      '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3',
      '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ee5a24', '#009432',
      '#0652dd', '#9c88ff', '#ffc048', '#ff3838', '#2ed573', '#3742fa',
      '#f368e0', '#ff5e57', '#26de81', '#4b7bec', '#fd79a8', '#fdcb6e',
      '#6c5ce7', '#fd79a8', '#e17055', '#00b894', '#0984e3', '#6c5ce7',
      '#e84393', '#00cec9', '#00b894', '#fdcb6e', '#e17055', '#74b9ff'
    ];
    
    this.init();
  }
  
  init() {
    this.createGallery();
    this.setupEventListeners();
    this.createColorPalette();
    this.createDrawSound();
  }
  
  createGallery() {
    const gallery = document.getElementById('gallery-grid');
    gallery.innerHTML = '';
    
    this.images.forEach((imagePath, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `<img src="${imagePath}" alt="Dibujo ${index + 1}" loading="lazy">`;
      item.addEventListener('click', () => this.openDrawing(imagePath));
      gallery.appendChild(item);
    });
  }
  
  createColorPalette() {
    const paletteGrid = document.querySelector('.palette-grid');
    paletteGrid.innerHTML = '';
    
    this.colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      colorOption.style.backgroundColor = color;
      colorOption.addEventListener('click', () => this.selectColor(color));
      paletteGrid.appendChild(colorOption);
    });
  }
  
  createDrawSound() {
    // El audio se carga desde el archivo HTML
    this.audio = document.getElementById('draw-sound');
    if (this.audio) {
      this.audio.volume = 0.3;
      this.audio.loop = true;
    }
    this.audioPlaying = false;
    this.audioFadeInterval = null;
  }
  
  playDrawSound() {
    if (this.audio && this.audio.readyState >= 2 && !this.audioPlaying) {
      // Limpiar cualquier fade anterior
      if (this.audioFadeInterval) {
        clearInterval(this.audioFadeInterval);
      }
      
      this.audio.currentTime = 0;
      this.audio.volume = 0;
      this.audio.play().then(() => {
        this.audioPlaying = true;
        // Fade in suave
        this.fadeInAudio();
      }).catch(e => console.log('Audio no disponible'));
    }
  }
  
  stopDrawSound() {
    if (this.audio && this.audioPlaying) {
      // Fade out suave antes de parar
      this.fadeOutAudio();
    }
  }
  
  fadeInAudio() {
    let volume = 0;
    const targetVolume = 0.3;
    const fadeStep = 0.05;
    
    this.audioFadeInterval = setInterval(() => {
      volume += fadeStep;
      if (volume >= targetVolume) {
        volume = targetVolume;
        clearInterval(this.audioFadeInterval);
      }
      if (this.audio) {
        this.audio.volume = volume;
      }
    }, 50);
  }
  
  fadeOutAudio() {
    let volume = this.audio.volume;
    const fadeStep = 0.1;
    
    this.audioFadeInterval = setInterval(() => {
      volume -= fadeStep;
      if (volume <= 0) {
        volume = 0;
        if (this.audio) {
          this.audio.volume = volume;
          this.audio.pause();
          this.audio.currentTime = 0;
        }
        this.audioPlaying = false;
        clearInterval(this.audioFadeInterval);
      } else if (this.audio) {
        this.audio.volume = volume;
      }
    }, 50);
  }
  
  openDrawing(imagePath) {
    document.getElementById('gallery-screen').classList.remove('active');
    document.getElementById('drawing-screen').classList.add('active');
    
    this.setupCanvas();
    this.loadLineArt(imagePath);
    this.saveState();
  }
  
  setupCanvas() {
    this.canvas = document.getElementById('drawing-canvas');
    this.ctx = this.canvas.getContext('2d');
    
    // Configurar tamaño del canvas para móviles
    const container = document.querySelector('.canvas-container');
    const containerRect = container.getBoundingClientRect();
    const size = Math.min(containerRect.width - 40, containerRect.height - 40, 600);
    
    this.canvas.width = size;
    this.canvas.height = size;
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    
    // Configurar contexto para suavizado
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.imageSmoothingEnabled = true;
    
    this.setupCanvasEvents();
  }
  
  setupCanvasEvents() {
    // Eventos táctiles
    this.canvas.addEventListener('touchstart', this.startDrawing.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.draw.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.stopDrawing.bind(this), { passive: false });
    
    // Eventos de ratón (para desarrollo)
    this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    this.canvas.addEventListener('mousemove', this.draw.bind(this));
    this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
  }
  
  loadLineArt(imagePath) {
    const lineArt = document.getElementById('line-art');
    lineArt.src = imagePath;
    lineArt.style.width = this.canvas.style.width;
    lineArt.style.height = this.canvas.style.height;
  }
  
  getEventPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  startDrawing(e) {
    e.preventDefault();
    
    this.isDrawing = true;
    const pos = this.getEventPos(e);
    this.lastX = pos.x;
    this.lastY = pos.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    
    // Iniciar sonido al comenzar a dibujar
    this.playDrawSound();
  }
  
  draw(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    const pos = this.getEventPos(e);
    
    this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over';
    this.ctx.strokeStyle = this.isEraser ? 'rgba(0,0,0,1)' : this.currentColor;
    this.ctx.lineWidth = this.currentSize;
    
    // Dibujo suavizado
    this.ctx.lineTo(pos.x, pos.y);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x, pos.y);
    
    // Efectos visuales
    this.createParticles(pos.x, pos.y);
    
    this.lastX = pos.x;
    this.lastY = pos.y;
  }
  
  stopDrawing(e) {
    if (!this.isDrawing) return;
    e.preventDefault();
    
    this.isDrawing = false;
    this.ctx.beginPath();
    this.saveState();
    
    // Detener sonido al terminar de dibujar
    this.stopDrawSound();
  }
  
  createParticles(x, y) {
    const container = document.getElementById('particles-container');
    const canvasContainer = document.querySelector('.canvas-container');
    const canvasRect = canvasContainer.getBoundingClientRect();
    const canvasStyle = this.canvas.getBoundingClientRect();
    
    // Calcular posición relativa al contenedor del canvas
    const relativeX = x * (canvasStyle.width / this.canvas.width);
    const relativeY = y * (canvasStyle.height / this.canvas.height);
    
    for (let i = 0; i < 3; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = (canvasStyle.left - canvasRect.left + relativeX - 3) + 'px';
      particle.style.top = (canvasStyle.top - canvasRect.top + relativeY - 3) + 'px';
      particle.style.background = `radial-gradient(circle, ${this.currentColor} 0%, transparent 70%)`;
      
      container.appendChild(particle);
      
      setTimeout(() => {
        if (container.contains(particle)) {
          container.removeChild(particle);
        }
      }, 1000);
    }
  }
  
  selectColor(color) {
    this.currentColor = color;
    this.isEraser = false;
    document.getElementById('color-btn').style.backgroundColor = color;
    
    const palette = document.getElementById('color-palette');
    palette.classList.add('hidden');
    palette.style.display = 'none';
    
    // Actualizar botones de borrador
    document.getElementById('eraser-btn').classList.remove('active');
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    });
  }
  
  setBrushSize(size) {
    this.currentSize = size;
    this.isEraser = false;
    
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-size="${size}"]`).classList.add('active');
  }
  
  toggleEraser() {
    this.isEraser = !this.isEraser;
    const eraserBtn = document.getElementById('eraser-btn');
    
    if (this.isEraser) {
      eraserBtn.classList.add('active');
      eraserBtn.style.background = '#ff6b6b';
    } else {
      eraserBtn.classList.remove('active');
      eraserBtn.style.background = '';
    }
  }
  
  clearCanvas() {
    if (confirm('¿Estás seguro de que quieres borrar todo el dibujo?')) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.saveState();
    }
  }
  
  saveState() {
    this.currentHistoryStep++;
    if (this.currentHistoryStep < this.drawingHistory.length) {
      this.drawingHistory.length = this.currentHistoryStep;
    }
    this.drawingHistory.push(this.canvas.toDataURL());
  }
  
  undo() {
    if (this.currentHistoryStep > 0) {
      this.currentHistoryStep--;
      this.restoreState();
    }
  }
  
  redo() {
    if (this.currentHistoryStep < this.drawingHistory.length - 1) {
      this.currentHistoryStep++;
      this.restoreState();
    }
  }
  
  restoreState() {
    const img = new Image();
    img.onload = () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(img, 0, 0);
    };
    img.src = this.drawingHistory[this.currentHistoryStep];
  }
  
  saveDrawing() {
    // Crear canvas temporal para combinar líneas y colores
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    
    // Fondo blanco
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // Dibujo del usuario
    tempCtx.drawImage(this.canvas, 0, 0);
    
    // Líneas del arte
    const lineArt = document.getElementById('line-art');
    if (lineArt.complete) {
      tempCtx.drawImage(lineArt, 0, 0, tempCanvas.width, tempCanvas.height);
    }
    
    // Descargar
    const link = document.createElement('a');
    link.download = `mi-dibujo-${Date.now()}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
    
    // Animación de guardado
    const saveBtn = document.getElementById('save-btn');
    saveBtn.classList.add('bounce');
    setTimeout(() => saveBtn.classList.remove('bounce'), 1000);
  }
  
  goBackToGallery() {
    if (confirm('¿Quieres volver a la galería? Se perderá el dibujo actual.')) {
      document.getElementById('drawing-screen').classList.remove('active');
      document.getElementById('gallery-screen').classList.add('active');
      
      // Limpiar canvas
      if (this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.drawingHistory = [];
      this.currentHistoryStep = -1;
    }
  }
  
  setupEventListeners() {
    // Botones de herramientas
    document.getElementById('back-btn').addEventListener('click', () => this.goBackToGallery());
    const colorBtn = document.getElementById('color-btn');
    
    // Función para toggle de paleta simplificada
    const togglePalette = () => {
      const palette = document.getElementById('color-palette');
      const isHidden = palette.classList.contains('hidden');
      
      if (isHidden) {
        palette.classList.remove('hidden');
        palette.style.display = 'block';
      } else {
        palette.classList.add('hidden');
        palette.style.display = 'none';
      }
    };
    
    // Event listeners unificados
    colorBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePalette();
    });
    
    colorBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePalette();
    }, { passive: false });
    
    document.querySelectorAll('.brush-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setBrushSize(parseInt(btn.dataset.size)));
    });
    
    document.getElementById('eraser-btn').addEventListener('click', () => this.toggleEraser());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearCanvas());
    document.getElementById('undo-btn').addEventListener('click', () => this.undo());
    document.getElementById('redo-btn').addEventListener('click', () => this.redo());
    document.getElementById('save-btn').addEventListener('click', () => this.saveDrawing());
    
    // Cerrar paleta al tocar fuera (múltiples eventos para móvil)
    const closePalette = (e) => {
      const palette = document.getElementById('color-palette');
      const colorBtn = document.getElementById('color-btn');
      
      if (!palette.contains(e.target) && e.target !== colorBtn && !colorBtn.contains(e.target)) {
        palette.classList.add('hidden');
      }
    };
    
    document.addEventListener('click', closePalette);
    document.addEventListener('touchstart', closePalette);
    
    // Prevenir scroll en dispositivos táctiles
    document.addEventListener('touchmove', (e) => {
      if (e.target.closest('#drawing-canvas')) {
        e.preventDefault();
      }
    }, { passive: false });
  }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new ColoringApp();
});

// Prevenir zoom en dispositivos táctiles
document.addEventListener('gesturestart', function (e) {
  e.preventDefault();
});

document.addEventListener('gesturechange', function (e) {
  e.preventDefault();
});

document.addEventListener('gestureend', function (e) {
  e.preventDefault();
});
