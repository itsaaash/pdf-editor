let currentPDF = null;
let pdfBytes = null;

// Theme Management
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        themeIcon.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    const themeIcon = document.getElementById('theme-icon');
    
    if (savedTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fas fa-sun';
    }
    
    setupFileUpload();
});

// Show loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Setup file upload functionality
function setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--primary-color)';
        uploadZone.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
    });
    
    uploadZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--glass-border)';
        uploadZone.style.backgroundColor = 'transparent';
    });
    
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = 'var(--glass-border)';
        uploadZone.style.backgroundColor = 'transparent';
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFile(files[0]);
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFile(e.target.files[0]);
    });
}

// Handle uploaded file
async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        showNotification('Please upload a PDF file only! 📄', 'error');
        return;
    }
    
    showLoading();
    
    try {
        pdfBytes = await file.arrayBuffer();
        currentPDF = await PDFLib.PDFDocument.load(pdfBytes);
        
        // Update UI
        const fileInfo = document.getElementById('fileInfo');
        fileInfo.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <strong>${file.name}</strong> loaded successfully<br>
            <small>${currentPDF.getPageCount()} pages • ${formatFileSize(file.size)}</small>
        `;
        fileInfo.style.display = 'block';
        
        document.getElementById('toolsSection').style.display = 'block';
        
        // Smooth scroll to tools
        document.getElementById('toolsSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        showNotification('PDF loaded successfully! 🎉', 'success');
    } catch (error) {
        showNotification('Error loading PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        ${message}
    `;
    
    // Add notification styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--primary-color)'};
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-weight: 500;
        z-index: 10000;
        animation: slideDown 0.3s ease;
        box-shadow: var(--shadow-lg);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Enhanced PDF functions with better UX
async function splitPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    
    const totalPages = currentPDF.getPageCount();
    const pageNum = prompt(`Enter page number to split at (1-${totalPages}):`);
    
    if (!pageNum || pageNum < 1 || pageNum > totalPages) {
        showNotification('Invalid page number!', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const firstPart = await PDFLib.PDFDocument.create();
        const firstPages = await firstPart.copyPages(currentPDF, 
            Array.from({length: pageNum - 1}, (_, i) => i));
        firstPages.forEach(page => firstPart.addPage(page));
        
        const secondPart = await PDFLib.PDFDocument.create();
        const secondPages = await secondPart.copyPages(currentPDF, 
            Array.from({length: totalPages - pageNum + 1}, (_, i) => i + pageNum - 1));
        secondPages.forEach(page => secondPart.addPage(page));
        
        downloadPDFPart(await firstPart.save(), 'part1.pdf');
        downloadPDFPart(await secondPart.save(), 'part2.pdf');
        
        showNotification('PDF split successfully! Check your downloads 📥', 'success');
    } catch (error) {
        showNotification('Error splitting PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function compressPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const compressedBytes = await currentPDF.save({
            useObjectStreams: false,
            addDefaultPage: false
        });
        
        const originalSize = pdfBytes.byteLength;
        const compressedSize = compressedBytes.byteLength;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        currentPDF = await PDFLib.PDFDocument.load(compressedBytes);
        pdfBytes = compressedBytes;
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification(`PDF compressed! Saved ${savings}% space 📦`, 'success');
    } catch (error) {
        showNotification('Error compressing PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function signPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    
    const signature = prompt('Enter your signature text:');
    if (!signature) return;
    
    showLoading();
    
    try {
        const pages = currentPDF.getPages();
        const lastPage = pages[pages.length - 1];
        
        lastPage.drawText(signature, {
            x: 50,
            y: 50,
            size: 12,
            color: PDFLib.rgb(0, 0, 1)
        });
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification('Signature added to last page! ✍️', 'success');
    } catch (error) {
        showNotification('Error adding signature: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function highlightPDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    
    const pageNum = prompt(`Which page to highlight? (1-${currentPDF.getPageCount()}):`);
    if (!pageNum) return;
    
    showLoading();
    
    try {
        const page = currentPDF.getPage(pageNum - 1);
        
        page.drawRectangle({
            x: 100,
            y: 200,
            width: 200,
            height: 20,
            color: PDFLib.rgb(1, 1, 0),
            opacity: 0.3
        });
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification('Highlight added! 🖍️', 'success');
    } catch (error) {
        showNotification('Error adding highlight: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// New rotate function
async function rotatePDF() {
    if (!currentPDF) {
        showNotification('Please upload a PDF first! 📄', 'error');
        return;
    }
    
    const pageNum = prompt(`Which page to rotate? (1-${currentPDF.getPageCount()}) or 'all' for all pages:`);
    if (!pageNum) return;
    
    const degrees = prompt('Rotate by how many degrees? (90, 180, 270):');
    if (!degrees || ![90, 180, 270].includes(parseInt(degrees))) {
        showNotification('Please enter 90, 180, or 270 degrees', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const pages = currentPDF.getPages();
        const rotation = parseInt(degrees);
        
        if (pageNum.toLowerCase() === 'all') {
            pages.forEach(page => page.setRotation(PDFLib.degrees(rotation)));
        } else {
            const page = pages[parseInt(pageNum) - 1];
            if (page) {
                page.setRotation(PDFLib.degrees(rotation));
            }
        }
        
        document.getElementById('downloadSection').style.display = 'block';
        showNotification(`Page(s) rotated by ${degrees}°! 🔄`, 'success');
    } catch (error) {
        showNotification('Error rotating PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

async function downloadPDF() {
    if (!currentPDF) return;
    
    showLoading();
    
    try {
        const pdfBytesModified = await currentPDF.save();
        downloadPDFPart(pdfBytesModified, 'edited-pdf.pdf');
        showNotification('PDF downloaded successfully! 🎉', 'success');
    } catch (error) {
        showNotification('Error downloading PDF: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function downloadPDFPart(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Placeholder functions for merge (you can implement these later)
function mergePDFs() {
    showNotification('Merge feature coming soon! 🚀', 'info');
}
