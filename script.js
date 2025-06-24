// Modal Management
let selectedRotationAngle = 90;
let selectedSignaturePosition = 'bottom-center';
let selectedHighlightColor = 'yellow';

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Initialize modal-specific data
    if (modalId === 'splitModal' || modalId === 'rotateModal' || modalId === 'highlightModal') {
        updatePageLimits();
    }
    if (modalId === 'compressModal') {
        updateFileSize();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal(e.target.id);
    }
});

// Update page limits for inputs
function updatePageLimits() {
    if (!currentPDF) return;
    
    const totalPages = currentPDF.getPageCount();
    const inputs = ['splitPage', 'rotatePage', 'highlightPage'];
    
    inputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.max = totalPages;
            if (parseInt(input.value) > totalPages) {
                input.value = totalPages;
            }
        }
    });
    
    updateSplitPreview();
}

// Page number adjustment
function adjustPageNumber(inputId, change) {
    const input = document.getElementById(inputId);
    const newValue = parseInt(input.value) + change;
    const min = parseInt(input.min);
    const max = parseInt(input.max);
    
    if (newValue >= min && newValue <= max) {
        input.value = newValue;
        if (inputId === 'splitPage') updateSplitPreview();
    }
}

// Update split preview
function updateSplitPreview() {
    const splitPage = parseInt(document.getElementById('splitPage').value);
    const totalPages = currentPDF ? currentPDF.getPageCount() : 1;
    
    document.getElementById('firstPartPages').textContent = `Pages 1-${splitPage}`;
    document.getElementById('secondPartPages').textContent = `Pages ${splitPage + 1}-${totalPages}`;
    document.getElementById('splitPageInfo').textContent = 
        `This will create 2 files: ${splitPage} pages + ${totalPages - splitPage} pages`;
}

// Update file size display
function updateFileSize() {
    if (pdfBytes) {
        document.getElementById('currentFileSize').textContent = formatFileSize(pdfBytes.byteLength);
    }
}

// Rotation card selection
document.addEventListener('DOMContentLoaded', function() {
    // ... existing DOMContentLoaded code ...
    
    // Rotation cards
    document.querySelectorAll('.rotation-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.rotation-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            selectedRotationAngle = parseInt(this.dataset.angle);
        });
    });
    
    // Position buttons
    document.querySelectorAll('.position-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.position-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedSignaturePosition = this.dataset.position;
        });
    });
    
    // Color options
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            selectedHighlightColor = this.dataset.color;
        });
    });
    
    // Radio button handlers
    document.querySelectorAll('input[name="rotatePages"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const specificGroup = document.getElementById('specificPageGroup');
            specificGroup.style.display = this.value === 'specific' ? 'block' : 'none';
        });
    });
    
    // Signature preview
    const signatureText = document.getElementById('signatureText');
    const signatureFont = document.getElementById('signatureFont');
    const signaturePreview = document.getElementById('signaturePreview');
    
    function updateSignaturePreview() {
        const text = signatureText.value || 'Your Name';
        const font = signatureFont.value;
        signaturePreview.textContent = text;
        signaturePreview.style.fontFamily = font;
    }
    
    signatureText.addEventListener('input', updateSignaturePreview);
    signatureFont.addEventListener('change', updateSignaturePreview);
    
    // Range input updates
    ['highlightX', 'highlightY', 'highlightWidth'].forEach(id => {
        const input = document.getElementById(id);
        const valueSpan = document.getElementById(id + 'Value');
        if (input && valueSpan) {
            input.addEventListener('input', function() {
                valueSpan.textContent = this.value;
            });
        }
    });
});

// Updated PDF Functions (replace the old ones)
function splitPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    openModal('splitModal');
}

function rotatePDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    openModal('rotateModal');
}

function signPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    openModal('signModal');
}

function highlightPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    openModal('highlightModal');
}

function compressPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    openModal('compressModal');
}

// Execute Functions
async function executeSplit() {
    const splitPage = parseInt(document.getElementById('splitPage').value);
    const totalPages = currentPDF.getPageCount();
    
    closeModal('splitModal');
    showLoading();
    
    try {
        const firstPart = await PDFLib.PDFDocument.create();
        const firstPages = await firstPart.copyPages(currentPDF, 
            Array.from({length: splitPage}, (_, i) => i));
        firstPages.forEach(page => firstPart.addPage(page));
        
        const secondPart = await PDFLib.PDFDocument.create();
        const secondPages = await secondPart.copyPages(currentPDF, 
            Array.from({length: totalPages - splitPage}, (_, i) => i + splitPage));
        secondPages.forEach(page => secondPart.addPage(page));
        
        downloadPDFPart(await firstPart.save(), `part1_pages1-${splitPage}.pdf`);
        downloadPDFPart(await secondPart.save(), `part2_pages${splitPage + 1}-${totalPages}.pdf`);
        
        showNotification('PDF split successfully! Check your downloads 📥', 'success');
    } catch (error) {
        showNotification('Error splitting PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function executeRotate() {
    const rotateAll = document.querySelector('input[name="rotatePages"]:checked').value === 'all';
    const specificPage = parseInt(document.getElementById('rotatePage').value);
    
    closeModal('rotateModal');
    showLoading();
    
    try {
        const pages = currentPDF.getPages();
        
        if (rotateAll) {
            pages.forEach(page => {
                const currentRotation = page.getRotation().angle;
                page.setRotation(PDFLib.degrees(currentRotation + selectedRotationAngle));
            });
        } else {
            const page = pages[specificPage - 1];
            if (page) {
                const currentRotation = page.getRotation().angle;
                page.setRotation(PDFLib.degrees(currentRotation + selectedRotationAngle));
            }
        }
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification(`Page(s) rotated by ${selectedRotationAngle}°! 🔄`, 'success');
    } catch (error) {
        showNotification('Error rotating PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function executeSign() {
    const activeTab = document.querySelector('.tab-btn.active').textContent.toLowerCase();
    
    closeModal('signModal');
    showLoading();
    
    try {
        const pages = currentPDF.getPages();
        const lastPage = pages[pages.length - 1];
        const { width, height } = lastPage.getSize();
        
        let x, y;
        
        // Calculate position based on selection
        switch (selectedSignaturePosition) {
            case 'top-left': x = 50; y = height - 50; break;
            case 'top-center': x = width / 2 - 50; y = height - 50; break;
            case 'top-right': x = width - 150; y = height - 50; break;
            case 'bottom-left': x = 50; y = 50; break;
            case 'bottom-center': x = width / 2 - 50; y = 50; break;
            case 'bottom-right': x = width - 150; y = 50; break;
            default: x = 50; y = 50;
        }
        
        if (activeTab === 'type') {
            const signatureText = document.getElementById('signatureText').value || 'Signature';
            lastPage.drawText(signatureText, {
                x: x,
                y: y,
                size: 16,
                color: PDFLib.rgb(0, 0, 1)
            });
        }
        // Drawing signature would require more complex implementation
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification('Signature added successfully! ✍️', 'success');
    } catch (error) {
        showNotification('Error adding signature: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function executeHighlight() {
    const pageNum = parseInt(document.getElementById('highlightPage').value);
    const x = parseInt(document.getElementById('highlightX').value);
    const y = parseInt(document.getElementById('highlightY').value);
    const width = parseInt(document.getElementById('highlightWidth').value);
    
    closeModal('highlightModal');
    showLoading();
    
    try {
        const page = currentPDF.getPage(pageNum - 1);
        
        // Color mapping
        const colors = {
            yellow: PDFLib.rgb(1, 1, 0),
            green: PDFLib.rgb(0.3, 0.8, 0.3),
            blue: PDFLib.rgb(0.1, 0.6, 1),
            pink: PDFLib.rgb(0.9, 0.1, 0.4),
            orange: PDFLib.rgb(1, 0.6, 0)
        };
        
        page.drawRectangle({
            x: x,
            y: y,
            width: width,
            height: 20,
            color: colors[selectedHighlightColor],
            opacity: 0.4
        });
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification('Highlight added successfully! 🖍️', 'success');
    } catch (error) {
        showNotification('Error adding highlight: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function executeCompress() {
    const compressionLevel = document.querySelector('input[name="compression"]:checked').value;
    
    closeModal('compressModal');
    showLoading();
    
    try {
        // Different compression settings based on level
        const settings = {
            low: { useObjectStreams: true, addDefaultPage: false },
            medium: { useObjectStreams: false, addDefaultPage: false },
            high: { useObjectStreams: false, addDefaultPage: false, compress: true }
        };
        
        const compressedBytes = await currentPDF.save(settings[compressionLevel]);
        
        const originalSize = pdfBytes.byteLength;
        const compressedSize = compressedBytes.byteLength;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        currentPDF = await PDFLib.PDFDocument.load(compressedBytes);
        pdfBytes = compressedBytes;
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification(`PDF compressed! Saved ${savings}% space (${formatFileSize(originalSize - compressedSize)}) 📦`, 'success');
    } catch (error) {
        showNotification('Error compressing PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Tab switching for signature modal
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
    
    event.target.classList.add('active');
    document.getElementById(tabName + 'Tab').style.display = 'block';
}

// Canvas drawing (basic implementation)
let isDrawing = false;
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas?.getContext('2d');

if (canvas && ctx) {
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath();
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
