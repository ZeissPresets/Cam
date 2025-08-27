class RealTimeWebcamEnhancer {
    constructor() {
        this.originalVideo = document.getElementById('originalVideo');
        this.enhancedVideo = document.getElementById('enhancedVideo');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.switchCameraBtn = document.getElementById('switchCamera');
        this.toggleEnhancementBtn = document.getElementById('toggleEnhancement');
        this.captureBtn = document.getElementById('captureBtn');
        this.toggleFullscreenBtn = document.getElementById('toggleFullscreen');
        this.recordBtn = document.getElementById('recordBtn');
        
        // Status elements
        this.statusElement = document.getElementById('status');
        this.processingTimeElement = document.getElementById('processingTime');
        this.enhancementStatusElement = document.getElementById('enhancementStatus');
        this.originalResolutionElement = document.getElementById('originalResolution');
        this.enhancedResolutionElement = document.getElementById('enhancedResolution');
        this.originalFpsElement = document.getElementById('originalFps');
        this.enhancedFpsElement = document.getElementById('enhancedFps');
        this.modelUsedElement = document.getElementById('modelUsed');
        
        // Controls
        this.sharpnessSlider = document.getElementById('sharpness');
        this.brightnessSlider = document.getElementById('brightness');
        this.contrastSlider = document.getElementById('contrast');
        this.sharpnessValue = document.getElementById('sharpnessValue');
        this.brightnessValue = document.getElementById('brightnessValue');
        this.contrastValue = document.getElementById('contrastValue');
        
        // Gallery
        this.galleryElement = document.getElementById('gallery');
        this.imagesContainer = document.getElementById('imagesContainer');
        
        this.mediaStream = null;
        this.cameras = [];
        this.currentCameraIndex = 0;
        this.enhancementActive = false;
        this.currentMode = 'standard';
        this.socket = null;
        
        this.enhancedContext = this.enhancedVideo.getContext('2d');
        this.originalFps = 0;
        this.enhancedFps = 0;
        this.lastOriginalFrameTime = 0;
        this.lastEnhancedFrameTime = 0;
        
        this.initializeEventListeners();
        this.initializeSocket();
        this.getCameras();
    }
    
    initializeEventListeners() {
        this.switchCameraBtn.addEventListener('click', () => this.switchCamera());
        this.toggleEnhancementBtn.addEventListener('click', () => this.toggleEnhancement());
        this.captureBtn.addEventListener('click', () => this.captureImage());
        this.toggleFullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.recordBtn.addEventListener('click', () => this.toggleRecording());
        
        // Mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMode = e.target.dataset.mode;
                this.updateStatus(`Mode diubah ke: ${this.getModeName(this.currentMode)}`);
            });
        });
        
        // Sliders
        this.sharpnessSlider.addEventListener('input', (e) => {
            this.sharpnessValue.textContent = `${e.target.value}%`;
        });
        
        this.brightnessSlider.addEventListener('input', (e) => {
            this.brightnessValue.textContent = `${e.target.value}%`;
        });
        
        this.contrastSlider.addEventListener('input', (e) => {
            this.contrastValue.textContent = `${e.target.value}%`;
        });
        
        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());
    }
    
    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            this.updateStatus('Terhubung ke server');
        });
        
        this.socket.on('disconnect', () => {
            this.updateStatus('Terputus dari server');
        });
        
        this.socket.on('enhanced-frame', (data) => {
            this.displayEnhancedFrame(data);
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            this.updateStatus('Koneksi error, menggunakan fallback client-side processing');
            this.enhancementActive = false;
            this.toggleEnhancementBtn.textContent = 'Aktifkan Peningkatan';
        });
    }
    
    async getCameras() {
        try {
            // First get permission to access cameras
            await navigator.mediaDevices.getUserMedia({ video: true });
            
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.cameras = devices.filter(device => device.kind === 'videoinput');
            
            this.populateCameraSelect();
            
            if (this.cameras.length > 0) {
                this.startCamera(this.cameras[0].deviceId);
            }
        } catch (error) {
            console.error('Error accessing cameras:', error);
            this.updateStatus('Tidak dapat mengakses kamera. Pastikan izin diberikan.');
        }
    }
    
    populateCameraSelect() {
        this.cameraSelect.innerHTML = '<option value="">Pilih Kamera...</option>';
        
        this.cameras.forEach((camera, index) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.text = camera.label || `Kamera ${index + 1}`;
            this.cameraSelect.appendChild(option);
        });
        
        this.cameraSelect.addEventListener('change', (e) => {
            this.selectCamera(e.target.value);
        });
    }
    
    async selectCamera(deviceId) {
        if (!deviceId) return;
        await this.startCamera(deviceId);
    }
    
    async switchCamera() {
        if (this.cameras.length <= 1) {
            this.updateStatus('Hanya satu kamera yang tersedia');
            return;
        }
        
        this.currentCameraIndex = (this.currentCameraIndex + 1) % this.cameras.length;
        await this.startCamera(this.cameras[this.currentCameraIndex].deviceId);
    }
    
    async startCamera(deviceId) {
        // Stop current stream if exists
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
            this.originalVideo.srcObject = this.mediaStream;
            
            // Set camera select value
            this.cameraSelect.value = deviceId;
            
            // Start processing frames
            this.originalVideo.onloadedmetadata = () => {
                this.enhancedVideo.width = this.originalVideo.videoWidth;
                this.enhancedVideo.height = this.originalVideo.videoHeight;
                
                this.originalResolutionElement.textContent = 
                    `${this.originalVideo.videoWidth}×${this.originalVideo.videoHeight}`;
                this.enhancedResolutionElement.textContent = 
                    `${this.enhancedVideo.width}×${this.enhancedVideo.height}`;
                
                this.updateStatus('Kamera siap');
                this.requestFrame();
            };
        } catch (error) {
            console.error('Error starting camera:', error);
            this.updateStatus('Gagal mengakses kamera');
        }
    }
    
    requestFrame() {
        if (this.originalVideo.srcObject) {
            requestAnimationFrame(() => this.processFrame());
        }
    }
    
    async processFrame() {
        // Calculate FPS for original video
        const now = performance.now();
        if (this.lastOriginalFrameTime > 0) {
            this.originalFps = Math.round(1000 / (now - this.lastOriginalFrameTime));
            this.originalFpsElement.textContent = this.originalFps;
        }
        this.lastOriginalFrameTime = now;
        
        if (this.enhancementActive && this.socket && this.socket.connected) {
            // Send frame to server for processing via WebSocket
            if (this.originalVideo.videoWidth > 0 && this.originalVideo.videoHeight > 0) {
                // Create a temporary canvas to get image data
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = this.originalVideo.videoWidth;
                tempCanvas.height = this.originalVideo.videoHeight;
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCtx.drawImage(this.originalVideo, 0, 0);
                const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Send to server for processing
                this.socket.emit('process-frame', {
                    imageData: Array.from(imageData.data),
                    width: imageData.width,
                    height: imageData.height,
                    enhancementType: this.currentMode
                });
            }
        } else if (this.enhancementActive) {
            // Fallback to client-side processing if server is not available
            this.processFrameClientSide();
        } else {
            // Just copy the original video to enhanced canvas
            this.enhancedContext.drawImage(this.originalVideo, 0, 0, 
                this.enhancedVideo.width, this.enhancedVideo.height);
            
            // Calculate FPS for enhanced video
            const enhancedNow = performance.now();
            if (this.lastEnhancedFrameTime > 0) {
                this.enhancedFps = Math.round(1000 / (enhancedNow - this.lastEnhancedFrameTime));
                this.enhancedFpsElement.textContent = this.enhancedFps;
            }
            this.lastEnhancedFrameTime = enhancedNow;
        }
        
        this.requestFrame();
    }
    
    displayEnhancedFrame(data) {
        if (data && data.imageData) {
            const imageData = new ImageData(
                new Uint8ClampedArray(data.imageData),
                data.width,
                data.height
            );
            
            this.enhancedContext.putImageData(imageData, 0, 0);
            
            // Update info
            this.modelUsedElement.textContent = data.modelName || 'Client-side';
            
            // Calculate FPS for enhanced video
            const now = performance.now();
            if (this.lastEnhancedFrameTime > 0) {
                this.enhancedFps = Math.round(1000 / (now - this.lastEnhancedFrameTime));
                this.enhancedFpsElement.textContent = this.enhancedFps;
                this.processingTimeElement.textContent = `${Math.round(now - this.lastEnhancedFrameTime)}ms`;
            }
            this.lastEnhancedFrameTime = now;
        }
    }
    
    async processFrameClientSide() {
        try {
            const startTime = performance.now();
            
            // Draw original video to canvas
            this.enhancedContext.drawImage(this.originalVideo, 0, 0, 
                this.enhancedVideo.width, this.enhancedVideo.height);
            
            // Get image data for processing
            const imageData = this.enhancedContext.getImageData(
                0, 0, this.enhancedVideo.width, this.enhancedVideo.height
            );
            
            // Apply enhancement based on current mode
            let enhancedImageData;
            switch (this.currentMode) {
                case 'super':
                    enhancedImageData = await applySuperResolution(imageData, 
                        parseInt(this.sharpnessSlider.value),
                        parseInt(this.contrastSlider.value)
                    );
                    break;
                case '200mp':
                    enhancedImageData = await apply200MPEnhancement(imageData);
                    break;
                case 'night':
                    enhancedImageData = await applyNightVision(imageData, 
                        parseInt(this.brightnessSlider.value)
                    );
                    break;
                case 'portrait':
                    enhancedImageData = await applyPortraitEnhancement(imageData,
                        parseInt(this.sharpnessSlider.value)
                    );
                    break;
                default:
                    enhancedImageData = await applyStandardEnhancement(imageData,
                        parseInt(this.sharpnessSlider.value),
                        parseInt(this.brightnessSlider.value),
                        parseInt(this.contrastSlider.value)
                    );
            }
            
            // Put enhanced image data back to canvas
            this.enhancedContext.putImageData(enhancedImageData, 0, 0);
            
            // Calculate FPS and processing time
            const endTime = performance.now();
            this.enhancedFps = Math.round(1000 / (endTime - this.lastEnhancedFrameTime));
            this.enhancedFpsElement.textContent = this.enhancedFps;
            this.processingTimeElement.textContent = `${Math.round(endTime - startTime)}ms`;
            this.lastEnhancedFrameTime = endTime;
            
            this.modelUsedElement.textContent = this.getModeName(this.currentMode);
        } catch (error) {
            console.error('Client-side processing error:', error);
        }
    }
    
    toggleEnhancement() {
        this.enhancementActive = !this.enhancementActive;
        
        if (this.enhancementActive) {
            this.toggleEnhancementBtn.textContent = 'Nonaktifkan Peningkatan';
            this.enhancementStatusElement.textContent = 'Aktif';
            this.updateStatus('Peningkatan AI diaktifkan');
        } else {
            this.toggleEnhancementBtn.textContent = 'Aktifkan Peningkatan';
            this.enhancementStatusElement.textContent = 'Tidak aktif';
            this.updateStatus('Peningkatan AI dinonaktifkan');
        }
    }
    
    captureImage() {
        if (!this.enhancementActive) {
            alert('Aktifkan peningkatan AI terlebih dahulu!');
            return;
        }
        
        // Create a link to download the enhanced image
        const link = document.createElement('a');
        link.download = `ai-enhanced-${new Date().getTime()}.png`;
        link.href = this.enhancedVideo.toDataURL('image/png');
        link.click();
        
        // Add to gallery
        this.addToGallery(link.href);
        
        this.updateStatus('Foto disimpan');
    }
    
    addToGallery(imageUrl) {
        const img = document.createElement('img');
        img.src = imageUrl;
        img.alt = 'Enhanced image';
        
        this.imagesContainer.appendChild(img);
        this.galleryElement.classList.remove('hidden');
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            this.enhancedVideo.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }
    
    toggleRecording() {
        this.updateStatus('Fitur perekaman video dalam pengembangan');
        // Video recording functionality would be implemented here
    }
    
    handleResize() {
        // Adjust canvas size if needed when window is resized
        if (this.originalVideo.videoWidth > 0 && this.originalVideo.videoHeight > 0) {
            this.enhancedVideo.width = this.originalVideo.videoWidth;
            this.enhancedVideo.height = this.originalVideo.videoHeight;
        }
    }
    
    updateStatus(message) {
        this.statusElement.textContent = message;
        console.log(message);
    }
    
    getModeName(mode) {
        const modeNames = {
            'standard': 'Standard HD',
            'super': 'Super Resolution',
            '200mp': '200MP Enhancement',
            'night': 'Night Vision',
            'portrait': 'Portrait Enhancement'
        };
        
        return modeNames[mode] || 'Unknown Mode';
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RealTimeWebcamEnhancer();
});

// Client-side enhancement functions (fallback when server is not available)
async function applyStandardEnhancement(imageData, sharpness, brightness, contrast) {
    return enhanceImageResolution(imageData, 'standard', sharpness, brightness, contrast);
}

async function applySuperResolution(imageData, sharpness, contrast) {
    return enhanceImageResolution(imageData, 'super', sharpness, 100, contrast);
}

async function apply200MPEnhancement(imageData) {
    return enhanceTo200MP(imageData);
}

async function applyNightVision(imageData, brightness) {
    return enhanceImageResolution(imageData, 'night', 100, brightness, 100);
}

async function applyPortraitEnhancement(imageData, sharpness) {
    return enhanceImageResolution(imageData, 'portrait', sharpness, 100, 100);
}