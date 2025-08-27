class WebcamApp {
    constructor() {
        this.videoElement = document.getElementById('video');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.switchCameraBtn = document.getElementById('switchCamera');
        this.captureBtn = document.getElementById('capture');
        this.retakeBtn = document.getElementById('retake');
        this.downloadBtn = document.getElementById('download');
        this.toggleAdvancedBtn = document.getElementById('toggleAdvanced');
        this.toggleFocusBtn = document.getElementById('toggleFocus');
        this.originalCanvas = document.getElementById('originalCanvas');
        this.enhancedCanvas = document.getElementById('enhancedCanvas');
        this.resultsSection = document.querySelector('.results');
        this.advancedControls = document.querySelector('.advanced-controls');
        this.loadingElement = document.getElementById('loading');
        this.focusBox = document.getElementById('focusBox');
        this.modelUsedElement = document.getElementById('modelUsed');
        this.resolutionIncreaseElement = document.getElementById('resolutionIncrease');
        this.processingTimeElement = document.getElementById('processingTime');
        this.originalResElement = document.getElementById('originalRes');
        this.enhancedResElement = document.getElementById('enhancedRes');
        this.originalSizeElement = document.getElementById('originalSize');
        this.enhancedSizeElement = document.getElementById('enhancedSize');
        
        // Kontrol advanced
        this.sharpnessSlider = document.getElementById('sharpness');
        this.noiseReductionSlider = document.getElementById('noiseReduction');
        this.contrastSlider = document.getElementById('contrast');
        this.modelSelect = document.getElementById('modelSelect');
        this.sharpnessValue = document.getElementById('sharpnessValue');
        this.noiseValue = document.getElementById('noiseValue');
        this.contrastValue = document.getElementById('contrastValue');
        
        this.mediaStream = null;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.focusMode = false;
        this.advancedMode = false;
        this.originalImageData = null;
        this.enhancedImageData = null;
        
        this.initializeEventListeners();
        this.getCameras();
    }
    
    // Inisialisasi event listeners
    initializeEventListeners() {
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.captureBtn.addEventListener('click', () => this.captureImage());
        this.retakeBtn.addEventListener('click', () => this.retakePhoto());
        this.downloadBtn.addEventListener('click', () => this.downloadImage());
        this.toggleAdvancedBtn.addEventListener('click', () => this.toggleAdvancedMode());
        this.toggleFocusBtn.addEventListener('click', () => this.toggleFocusMode());
        this.cameraSelect.addEventListener('change', (e) => this.selectCamera(e.target.value));
        
        // Kontrol advanced
        this.sharpnessSlider.addEventListener('input', (e) => {
            this.sharpnessValue.textContent = `${e.target.value}%`;
        });
        
        this.noiseReductionSlider.addEventListener('input', (e) => {
            this.noiseValue.textContent = `${e.target.value}%`;
        });
        
        this.contrastSlider.addEventListener('input', (e) => {
            this.contrastValue.textContent = `${e.target.value}%`;
        });
        
        // Event untuk mode fokus
        this.videoElement.addEventListener('click', (e) => {
            if (this.focusMode) {
                this.setFocusPoint(e);
            }
        });
    }
    
    // Mendapatkan daftar kamera yang tersedia
    async getCameras() {
        try {
            // Pertama-tama, minta izin untuk mengakses perangkat
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            
            this.populateCameraSelect();
            
            if (this.cameras.length > 0) {
                this.startCamera(this.cameras[0].deviceId);
            }
        } catch (error) {
            console.error('Error accessing cameras:', error);
            alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin untuk menggunakan kamera.');
        }
    }
    
    // Mengisi dropdown pemilihan kamera
    populateCameraSelect() {
        this.cameraSelect.innerHTML = '<option value="">Pilih Kamera...</option>';
        
        this.cameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.text = camera.label || `Kamera ${index + 1}`;
            this.cameraSelect.appendChild(option);
        });
    }
    
    // Memilih kamera tertentu
    async selectCamera(deviceId) {
        if (!deviceId) return;
        
        await this.startCamera(deviceId);
    }
    
    // Berganti ke kamera berikutnya
    async switchCamera() {
        if (this.cameras.length <= 1) {
            alert('Hanya satu kamera yang terdeteksi');
            return;
        }
        
        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
        await this.startCamera(this.cameras[this.currentCameraIndex].deviceId);
    }
    
    // Memulai kamera dengan deviceId tertentu
    async startCamera(deviceId) {
        // Menghentikan stream yang sedang berjalan
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        
        try {
            const constraints = {
                video: {
                    deviceId: { exact: deviceId },
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                }
            };
            
            this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            this.videoElement.srcObject = this.mediaStream;
            
            // Memilih opsi yang sesuai di dropdown
            this.cameraSelect.value = deviceId;
            
            // Sembunyikan hasil jika ada
            this.resultsSection.classList.add('hidden');
        } catch (error) {
            console.error('Error starting camera:', error);
            alert('Tidak dapat memulai kamera. Pastikan perangkat mendukung akses kamera.');
        }
    }
    
    // Mengambil gambar dari video
    captureImage() {
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;
        
        // Mengatur ukuran canvas
        this.originalCanvas.width = videoWidth;
        this.originalCanvas.height = videoHeight;
        this.enhancedCanvas.width = videoWidth;
        this.enhancedCanvas.height = videoHeight;
        
        // Menggambar frame video ke canvas
        const context = this.originalCanvas.getContext('2d');
        context.drawImage(this.videoElement, 0, 0, videoWidth, videoHeight);
        
        // Mendapatkan data gambar
        this.originalImageData = context.getImageData(0, 0, videoWidth, videoHeight);
        
        // Menampilkan informasi resolusi asli
        this.originalResElement.textContent = `${videoWidth} × ${videoHeight}`;
        
        // Menampilkan loading
        this.showLoading(true);
        
        // Mendapatkan parameter peningkatan
        const enhanceParams = {
            sharpness: parseInt(this.sharpnessSlider.value),
            noiseReduction: parseInt(this.noiseReductionSlider.value),
            contrast: parseInt(this.contrastSlider.value),
            model: this.modelSelect.value
        };
        
        // Memproses peningkatan resolusi
        this.enhanceResolution(this.originalImageData, enhanceParams)
            .then(result => {
                this.enhancedImageData = result.imageData;
                
                // Menampilkan gambar yang telah ditingkatkan
                const enhancedContext = this.enhancedCanvas.getContext('2d');
                enhancedContext.putImageData(this.enhancedImageData, 0, 0);
                
                // Menampilkan informasi peningkatan
                this.modelUsedElement.textContent = result.modelName;
                this.resolutionIncreaseElement.textContent = result.resolutionIncrease;
                this.processingTimeElement.textContent = `${result.processingTime}ms`;
                this.enhancedResElement.textContent = `${this.enhancedCanvas.width} × ${this.enhancedCanvas.height}`;
                
                // Menampilkan perkiraan ukuran file
                this.estimateFileSizes();
                
                // Menampilkan hasil
                this.showResults();
                
                // Menyembunyikan loading
                this.showLoading(false);
            })
            .catch(error => {
                console.error('Error enhancing image:', error);
                alert('Terjadi kesalahan saat meningkatkan resolusi gambar.');
                this.showLoading(false);
            });
    }
    
    // Meningkatkan resolusi gambar menggunakan resolution.js
    async enhanceResolution(imageData, params) {
        return await enhanceImageResolution(imageData, params);
    }
    
    // Memperkirakan ukuran file
    estimateFileSizes() {
        // Simulasi perkiraan ukuran file
        const originalSize = Math.round(this.originalCanvas.width * this.originalCanvas.height * 0.0003);
        const enhancedSize = Math.round(this.enhancedCanvas.width * this.enhancedCanvas.height * 0.0004);
        
        this.originalSizeElement.textContent = `${originalSize} KB`;
        this.enhancedSizeElement.textContent = `${enhancedSize} KB`;
    }
    
    // Menampilkan hasil
    showResults() {
        this.resultsSection.classList.remove('hidden');
    }
    
    // Mengambil foto ulang
    retakePhoto() {
        this.resultsSection.classList.add('hidden');
    }
    
    // Mengunduh gambar hasil
    downloadImage() {
        if (!this.enhancedImageData) return;
        
        const link = document.createElement('a');
        link.download = 'enhanced-image.png';
        link.href = this.enhancedCanvas.toDataURL('image/png');
        link.click();
    }
    
    // Menampilkan/menyembunyikan loading
    showLoading(show) {
        if (show) {
            this.loadingElement.classList.remove('hidden');
            this.updateProgress(0);
            
            // Simulasi progress bar
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                this.updateProgress(progress);
            }, 200);
        } else {
            this.loadingElement.classList.add('hidden');
        }
    }
    
    // Memperbarui progress bar
    updateProgress(percent) {
        const progressBar = document.querySelector('.progress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }
    
    // Mengaktifkan/menonaktifkan mode advanced
    toggleAdvancedMode() {
        this.advancedMode = !this.advancedMode;
        if (this.advancedMode) {
            this.advancedControls.classList.remove('hidden');
            this.toggleAdvancedBtn.textContent = 'Sembunyikan Advanced';
        } else {
            this.advancedControls.classList.add('hidden');
            this.toggleAdvancedBtn.textContent = 'Mode Advanced';
        }
    }
    
    // Mengaktifkan/menonaktifkan mode fokus
    toggleFocusMode() {
        this.focusMode = !this.focusMode;
        if (this.focusMode) {
            this.focusBox.classList.add('visible');
            this.toggleFocusBtn.textContent = 'Nonaktifkan Fokus';
        } else {
            this.focusBox.classList.remove('visible');
            this.toggleFocusBtn.textContent = 'Mode Fokus';
        }
    }
    
    // Menetapkan titik fokus
    setFocusPoint(event) {
        const rect = this.videoElement.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Pindahkan kotak fokus ke titik yang diklik
        this.focusBox.style.left = `${x}px`;
        this.focusBox.style.top = `${y}px`;
        
        // Simulasi efek fokus (dalam implementasi nyata, ini akan mengatur fokus kamera)
        this.focusBox.style.borderColor = '#2ecc71';
        setTimeout(() => {
            this.focusBox.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        }, 300);
    }
}

// Inisialisasi aplikasi ketika halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    new WebcamApp();
});