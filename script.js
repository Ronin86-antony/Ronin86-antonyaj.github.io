document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const listSection = document.getElementById('list-section');
    const fileList = document.getElementById('file-list');
    const fileCountSpan = document.getElementById('file-count');
    const clearAllBtn = document.getElementById('clear-all');
    const mergeBtn = document.getElementById('merge-btn');
    const mergeSpinner = document.getElementById('merge-spinner');
    const btnTextContent = document.querySelector('.btn-text-content');

    let pdfFiles = [];

    // --- Event Listeners ---

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // File Input
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        // Reset input so the same file can be selected again if needed
        fileInput.value = '';
    });

    // Clear All
    clearAllBtn.addEventListener('click', () => {
        pdfFiles = [];
        renderFileList();
    });

    // Merge Action
    mergeBtn.addEventListener('click', mergePDFs);

    // --- Functions ---

    function handleFiles(files) {
        const newFiles = Array.from(files).filter(file => file.type === 'application/pdf');
        if (newFiles.length === 0) {
            alert('Please select valid PDF files.');
            return;
        }

        // Add to our state array
        pdfFiles = [...pdfFiles, ...newFiles];
        renderFileList();
    }

    function removeFile(index) {
        pdfFiles.splice(index, 1);
        renderFileList();
    }

    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    function renderFileList() {
        // Update visibility and counts
        if (pdfFiles.length > 0) {
            listSection.style.display = 'block';
            fileCountSpan.textContent = `(${pdfFiles.length})`;
            mergeBtn.disabled = pdfFiles.length < 2; // Need at least 2 to merge
            
            // Generate list items
            fileList.innerHTML = '';
            pdfFiles.forEach((file, index) => {
                const li = document.createElement('li');
                li.className = 'file-item';
                
                li.innerHTML = `
                    <div class="file-number">${index + 1}</div>
                    <div class="file-info">
                        <div class="file-name" title="${file.name}">${file.name}</div>
                        <div class="file-size">${formatBytes(file.size)}</div>
                    </div>
                    <button class="remove-btn" aria-label="Remove file" data-index="${index}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                `;
                fileList.appendChild(li);
            });

            // Add event listeners to remove buttons
            document.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                    removeFile(idx);
                });
            });

        } else {
            listSection.style.display = 'none';
            mergeBtn.disabled = true;
            fileList.innerHTML = '';
        }
    }

    async function mergePDFs() {
        if (pdfFiles.length < 2) return;

        setLoadingState(true);

        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdfDoc = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                
                copiedPages.forEach((page) => {
                    mergedPdf.addPage(page);
                });
            }

            const mergedPdfFile = await mergedPdf.save();
            downloadFile(mergedPdfFile, "Ronins_Merged_PDF.pdf", "application/pdf");

        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('An error occurred while merging the PDFs. Please try again or check your files.');
        } finally {
            setLoadingState(false);
        }
    }

    function setLoadingState(isLoading) {
        mergeBtn.disabled = isLoading;
        if (isLoading) {
            btnTextContent.style.display = 'none';
            mergeSpinner.style.display = 'block';
        } else {
            btnTextContent.style.display = 'block';
            mergeSpinner.style.display = 'none';
        }
    }

    function downloadFile(data, filename, type) {
        const blob = new Blob([data], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
});
