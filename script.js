document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const slides = document.querySelectorAll('.slide');
    const nextButtons = document.querySelectorAll('.next-btn');
    const prevButtons = document.querySelectorAll('.prev-btn');
    const progressBar = document.querySelector('.progress');
    const uploadInput = document.getElementById('photo-upload');
    const uploadArea = document.querySelector('.upload-area');
    const previewContainer = document.querySelector('.preview-container');
    const imagePreview = document.getElementById('image-preview');
    const uploadNextButton = document.getElementById('upload-next');
    const cropImage = document.getElementById('crop-image');
    const cropNextButton = document.getElementById('crop-next');
    const cropResetButton = document.getElementById('crop-reset');
    const finalImage = document.getElementById('final-image');
    const downloadButton = document.getElementById('download-btn');
    const formatButtons = document.querySelectorAll('.format-btn');
    const newPhotoButton = document.getElementById('new-photo-btn');
    const successAnimation = document.getElementById('success-animation');
    
    // Variables
    let currentSlide = 0;
    let cropper;
    let selectedFormat = 'png';
    let fileName = '';
    
    // Initialize Lottie animation
    if (successAnimation) {
        lottie.loadAnimation({
            container: successAnimation,
            renderer: 'svg',
            loop: false,
            autoplay: false,
            path: 'assets/success-animation.json'
        });
    }
    
    // Initialize slides
    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // Update progress bar
        const progress = (index / (slides.length - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        
        currentSlide = index;
    }
    
    // Next button event listeners
    nextButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentSlide < slides.length - 1) {
                showSlide(currentSlide + 1);
            }
        });
    });
    
    // Previous button event listeners
    prevButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentSlide > 0) {
                showSlide(currentSlide - 1);
            }
        });
    });
    
    // Upload functionality
    uploadInput.addEventListener('change', function(e) {
        if (e.target.files && e.target.files[0]) {
            fileName = e.target.files[0].name.split('.')[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                previewContainer.classList.remove('hidden');
                uploadNextButton.classList.remove('hidden');
                
                // Update crop image preview
                cropImage.src = event.target.result;
                
                // Initialize cropper when we get to the crop screen
                if (cropper) {
                    cropper.destroy();
                }
            };
            
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Drag and drop functionality
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = 'rgba(74, 111, 165, 0.2)';
        uploadArea.style.borderColor = 'var(--secondary-color)';
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = 'var(--primary-color)';
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = 'var(--primary-color)';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            uploadInput.files = e.dataTransfer.files;
            const event = new Event('change');
            uploadInput.dispatchEvent(event);
        }
    });
    
    // Initialize cropper when crop slide is shown
    document.getElementById('crop').addEventListener('transitionend', function() {
        if (this.classList.contains('active')) {
            if (cropper) {
                cropper.destroy();
            }
            
            cropper = new Cropper(cropImage, {
                aspectRatio: 1,
                viewMode: 1,
                autoCropArea: 0.8,
                responsive: true,
                guides: true,
                highlight: false,
                background: false,
                movable: true,
                rotatable: false,
                scalable: false,
                zoomable: true,
                cropBoxMovable: true,
                cropBoxResizable: true,
                toggleDragModeOnDblclick: false,
                ready: function() {
                    // Apply passport guide if selected
                    const selectedOption = document.querySelector('input[name="crop-option"]:checked').value;
                    if (selectedOption === 'passport') {
                        applyPassportGuide();
                    }
                }
            });
        }
    });
    
    // Crop options
    document.querySelectorAll('input[name="crop-option"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (!cropper) return;
            
            switch(this.value) {
                case 'free':
                    cropper.setAspectRatio(NaN);
                    break;
                case '1:1':
                    cropper.setAspectRatio(1);
                    break;
                case 'passport':
                    cropper.setAspectRatio(1);
                    applyPassportGuide();
                    break;
            }
        });
    });
    
    function applyPassportGuide() {
        // This is a simplified passport guide overlay
        // In a real app, you might want to add face detection and more precise guides
        const container = cropper.getContainerData();
        const canvas = cropper.getCanvasData();
        
        // Calculate face area (approximately)
        const faceWidth = canvas.width * 0.6;
        const faceHeight = canvas.height * 0.7;
        const faceTop = (canvas.height - faceHeight) / 2;
        
        // Create guide elements
        let guide = document.querySelector('.cropper-face-guide');
        if (!guide) {
            guide = document.createElement('div');
            guide.className = 'cropper-face-guide';
            guide.style.position = 'absolute';
            guide.style.border = '2px dashed rgba(255, 255, 255, 0.7)';
            guide.style.pointerEvents = 'none';
            document.querySelector('.cropper-container').appendChild(guide);
        }
        
        guide.style.width = `${faceWidth}px`;
        guide.style.height = `${faceHeight}px`;
        guide.style.left = `${(container.width - faceWidth) / 2}px`;
        guide.style.top = `${faceTop}px`;
    }
    
    // Crop reset button
    if (cropResetButton) {
        cropResetButton.addEventListener('click', function() {
            if (cropper) {
                cropper.reset();
                const selectedOption = document.querySelector('input[name="crop-option"]:checked').value;
                if (selectedOption === 'passport') {
                    applyPassportGuide();
                }
            }
        });
    }
    
    // When moving from crop to resize
    if (cropNextButton) {
        cropNextButton.addEventListener('click', function() {
            if (cropper) {
                // Get cropped canvas
                const canvas = cropper.getCroppedCanvas({
                    width: 300,
                    height: 300,
                    minWidth: 300,
                    minHeight: 300,
                    maxWidth: 300,
                    maxHeight: 300,
                    fillColor: '#fff',
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                
                // Update final image preview
                finalImage.src = canvas.toDataURL(`image/${selectedFormat}`);
                
                // Update file info
                document.getElementById('dimensions').textContent = '300x300px';
                updateFileSize(canvas);
            }
        });
    }
    
    // Format selection
    formatButtons.forEach(button => {
        button.addEventListener('click', function() {
            formatButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            selectedFormat = this.dataset.format;
            document.getElementById('file-format').textContent = selectedFormat.toUpperCase();
            
            // Update preview with new format
            if (finalImage.src && finalImage.src !== '#') {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    canvas.width = 300;
                    canvas.height = 300;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 300, 300);
                    finalImage.src = canvas.toDataURL(`image/${selectedFormat}`);
                    updateFileSize(canvas);
                };
                img.src = finalImage.src;
            }
        });
    });
    
    function updateFileSize(canvas) {
        canvas.toBlob(blob => {
            const sizeInKB = Math.round(blob.size / 1024);
            document.getElementById('file-size').textContent = `${sizeInKB}KB`;
            
            // Warn if file size is approaching limit
            if (sizeInKB > 450) {
                document.getElementById('file-size').style.color = 'var(--warning-color)';
            } else {
                document.getElementById('file-size').style.color = '';
            }
        }, `image/${selectedFormat}`, 0.9);
    }
    
    // Download functionality
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
            if (finalImage.src && finalImage.src !== '#') {
                const link = document.createElement('a');
                link.download = `UNIVERSITY-WARMUP-passport-${fileName || 'photo'}.${selectedFormat}`;
                link.href = finalImage.src;
                link.click();
                
                // Show success screen
                showSlide(slides.length - 1);
                
                // Play success animation
                if (lottie.getRegisteredAnimations().length > 0) {
                    lottie.play();
                }
            }
        });
    }
    
    // New photo button
    if (newPhotoButton) {
        newPhotoButton.addEventListener('click', function() {
            // Reset the flow
            uploadInput.value = '';
            previewContainer.classList.add('hidden');
            uploadNextButton.classList.add('hidden');
            finalImage.src = '#';
            
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            
            // Go back to upload screen
            showSlide(3); // Upload screen index
        });
    }
    
    // Start with the first slide
    showSlide(0);
    
    // Add animation classes when elements come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('slide-in');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.content > *').forEach(el => {
        observer.observe(el);
    });
});