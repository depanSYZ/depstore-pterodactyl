// Konfigurasi Bot Telegram
const TELEGRAM_BOT_TOKEN = '8587917902:AAFWcp4nHk-cYmxVglHexZCBrB8P0rz-2aY';
const TELEGRAM_CHAT_ID = '6249825045'; // ID Admin Telegram

// Data paket
let selectedPackage = {
    ram: '2GB',
    price: 2000
};

// Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Update ringkasan
function updateSummary() {
    document.getElementById('selectedPackage').textContent = selectedPackage.ram;
    document.getElementById('selectedPrice').textContent = formatRupiah(selectedPackage.price);
    document.getElementById('totalPrice').textContent = formatRupiah(selectedPackage.price);
    
    const panelName = document.getElementById('panelName').value;
    document.getElementById('displayPanelName').textContent = panelName || '-';
}

// Pilih paket
document.querySelectorAll('.package').forEach(pkg => {
    pkg.addEventListener('click', function() {
        // Remove active dari semua paket
        document.querySelectorAll('.package').forEach(p => {
            p.classList.remove('active');
        });
        
        // Tambah active ke paket yang dipilih
        this.classList.add('active');
        
        // Update paket terpilih
        selectedPackage = {
            ram: this.getAttribute('data-ram'),
            price: parseInt(this.getAttribute('data-price'))
        };
        
        updateSummary();
    });
});

// Update real-time pada form
document.getElementById('panelName').addEventListener('input', updateSummary);
document.getElementById('email').addEventListener('input', updateSummary);
document.getElementById('telegram').addEventListener('input', updateSummary);

// Update payment method display
document.querySelectorAll('input[name="payment"]').forEach(radio => {
    radio.addEventListener('change', function() {
        const paymentDisplay = document.getElementById('displayPayment');
        const method = this.value.toUpperCase();
        paymentDisplay.textContent = method;
    });
});

// Preview file upload
document.getElementById('buktiTF').addEventListener('change', function(e) {
    const preview = document.getElementById('filePreview');
    preview.innerHTML = '';
    
    if (this.files && this.files[0]) {
        const file = this.files[0];
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                preview.appendChild(img);
            }
            reader.readAsDataURL(file);
        } else {
            const icon = document.createElement('div');
            icon.innerHTML = `<i class="fas fa-file-pdf" style="font-size: 50px; color: #4cc9f0;"></i>`;
            const fileName = document.createElement('p');
            fileName.textContent = file.name;
            fileName.style.marginTop = '10px';
            preview.appendChild(icon);
            preview.appendChild(fileName);
        }
    }
});

// Kirim data ke Telegram
async function sendToTelegram(formData) {
    // Ganti dengan API key bot Telegram Anda
    const message = `📦 *PESANAN PANEL BARU*
    
👤 *Data Pemesan:*
• Nama Panel: ${formData.panelName}
• Email: ${formData.email}
• Telegram: ${formData.telegram}

📊 *Paket:*
• RAM: ${formData.package.ram}
• Harga: ${formatRupiah(formData.package.price)}

💳 *Pembayaran:*
• Metode: ${formData.paymentMethod.toUpperCase()}

🔄 *Status:* Menunggu Verifikasi

⚠️ *PERHATIAN:* Verifikasi bukti transfer di email admin`;

    try {
        // Kirim ke bot Telegram
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Error sending to Telegram:', error);
        return false;
    }
}

// Handle form submission
document.getElementById('orderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validasi
    const panelName = document.getElementById('panelName').value;
    const email = document.getElementById('email').value;
    const telegram = document.getElementById('telegram').value;
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    const buktiTF = document.getElementById('buktiTF').files[0];
    
    if (!paymentMethod) {
        alert('Pilih metode pembayaran!');
        return;
    }
    
    if (!buktiTF) {
        alert('Upload bukti transfer!');
        return;
    }
    
    // Tampilkan modal loading
    const modal = document.getElementById('statusModal');
    const statusMessage = document.getElementById('statusMessage');
    modal.classList.add('active');
    
    // Buat form data
    const formData = {
        panelName,
        email,
        telegram,
        package: selectedPackage,
        paymentMethod: paymentMethod.value,
        timestamp: new Date().toISOString()
    };
    
    // Simulasi proses (ganti dengan koneksi ke server/API sesungguhnya)
    statusMessage.textContent = 'Menyimpan data pesanan...';
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    statusMessage.textContent = 'Mengirim ke admin Telegram...';
    const telegramSuccess = await sendToTelegram(formData);
    
    if (telegramSuccess) {
        statusMessage.textContent = 'Pesanan berhasil dikirim! Admin akan menghubungi Anda segera.';
        
        // Simpan ke localStorage (untuk demo)
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push({ ...formData, id: Date.now(), status: 'pending' });
        localStorage.setItem('orders', JSON.stringify(orders));
        
        // Reset form setelah 2 detik
        setTimeout(() => {
            modal.classList.remove('active');
            alert('✅ Pesanan berhasil dikirim!\nAdmin akan verifikasi dan menghubungi Anda via Telegram.');
            this.reset();
            document.getElementById('filePreview').innerHTML = '';
            updateSummary();
        }, 2000);
    } else {
        statusMessage.textContent = 'Gagal mengirim pesanan. Coba lagi atau hubungi admin langsung.';
        setTimeout(() => {
            modal.classList.remove('active');
            alert('❌ Gagal mengirim otomatis. Silakan hubungi admin secara manual.');
        }, 2000);
    }
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    updateSummary();
    
    // Auto select first payment method
    const firstPayment = document.querySelector('input[name="payment"]');
    if (firstPayment) {
        firstPayment.checked = true;
        document.getElementById('displayPayment').textContent = firstPayment.value.toUpperCase();
    }
});

// Untuk deploy, ganti TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID dengan milik Anda
// Anda perlu membuat bot Telegram via @BotFather dan dapatkan token
// Untuk chat_id, kirim pesan ke bot @userinfobot

// Note: Untuk fitur lengkap, Anda perlu backend untuk:
// 1. Menyimpan data ke database
// 2. Handle upload file
// 3. Integrasi payment gateway
// 4. Auto create panel via Pterodactyl API
