document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const monthSelect = document.getElementById('month-select');
    const spreadsheetBody = document.getElementById('spreadsheet-body');
    const monthlyTotal = document.getElementById('monthly-total');
    const newEntryBtn = document.getElementById('new-entry');
    const newBatchBtn = document.getElementById('new-batch');
    const entryModal = document.getElementById('entry-modal');
    const batchModal = document.getElementById('batch-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const closeBatchModalBtn = document.getElementById('close-batch-modal');
    const cancelEntryBtn = document.getElementById('cancel-entry');
    const cancelBatchBtn = document.getElementById('cancel-batch');
    const entryForm = document.getElementById('entry-form');
    const batchEntries = document.getElementById('batch-entries');
    const addRowBtn = document.getElementById('add-row');
    const saveBatchBtn = document.getElementById('save-batch');
    const modalTitle = document.getElementById('modal-title');
    const confettiContainer = document.getElementById('confetti-container');
    const notificationsContainer = document.getElementById('notifications');
    
    // Current month and editing state
    let currentMonth = monthSelect.value;
    let isEditing = false;
    let currentEditId = null;
    
    // API base URL
     const API_URL = "https://hellokitty-three.vercel.app/api";
    
    // Initialize the app
    async function init() {
        await fetchData();
        checkNotifications();
        
        // Set today's date as default in forms
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('forecast').value = today;
    }
    
    // Fetch data from backend
    async function fetchData() {
        try {
            const response = await fetch(`${API_URL}/entries`);
            const data = await response.json();
            renderSpreadsheet(data);
            calculateMonthlyTotal(data);
        } catch (error) {
            console.error('Error fetching data:', error);
            showError('Erro ao carregar dados. Tente recarregar a página.');
        }
    }
    
    // Check for upcoming dates and show notifications
    async function checkNotifications() {
        try {
            const response = await fetch(`${API_URL}/notifications`);
            const notifications = await response.json();
            
            notificationsContainer.innerHTML = '';
            
            if (notifications.length === 0) return;
            
            notifications.forEach(notification => {
                const notificationEl = document.createElement('div');
                notificationEl.className = `notification ${notification.type}`;
                
                const icon = notification.type === 'warning' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle';
                const message = notification.type === 'warning' 
                    ? `Atenção: O pagamento de ${notification.client} vence em ${notification.daysLeft} dias (${formatDate(notification.forecast)})`
                    : `Urgente: O pagamento de ${notification.client} vence hoje! (${formatDate(notification.forecast)})`;
                
                notificationEl.innerHTML = `
                    <i class="fas ${icon}"></i>
                    <span>${message}</span>
                `;
                
                notificationsContainer.appendChild(notificationEl);
            });
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }
    
    // Render the spreadsheet
    function renderSpreadsheet(data) {
        let filteredData = data;
        
        if (currentMonth !== '0') {
            filteredData = data.filter(entry => {
                const entryMonth = new Date(entry.date).getMonth() + 1;
                return entryMonth.toString() === currentMonth;
            });
        }
        
        if (filteredData.length === 0) {
            spreadsheetBody.innerHTML = `
                <tr>
                    <td colspan="9" class="px-6 py-4 text-center hello-kitty-text animate__animated animate__fadeIn">
                        Nenhum dado encontrado${currentMonth !== '0' ? ' para este mês' : ''}. Clique em "Nova Entrada" para adicionar.
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        filteredData.forEach((entry, index) => {
            const statusClass = getStatusClass(entry.status);
            const formattedCommission = formatCurrency(entry.commission);
            const formattedDate = formatDate(entry.date);
            const formattedForecast = formatDate(entry.forecast);
            const daysLeft = calculateDaysLeft(entry.forecast);
            const daysLeftClass = daysLeft <= 0 ? 'text-red-500 font-bold' : daysLeft <= 15 ? 'text-yellow-600' : 'text-green-600';
            
            html += `
                <tr class="row-animation animate__animated animate__fadeIn" style="animation-delay: ${index * 0.05}s">
                    <td class="px-6 py-4 whitespace-nowrap hello-kitty-text">${entry.id}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${entry.client}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${formattedDate}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${entry.product}</td>
                    <td class="px-6 py-4 whitespace-nowrap hello-kitty-text font-bold">${formattedCommission}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${formattedForecast}</td>
                    <td class="px-6 py-4 whitespace-nowrap ${daysLeftClass}">${daysLeft <= 0 ? 'Vencido' : `${daysLeft} dias`}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2 py-1 rounded-full text-sm ${statusClass}">${getStatusText(entry.status)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <button onclick="editEntry(${entry.id})" class="hello-kitty-text hover:text-pink-700 mr-2 transform hover:scale-125 transition-transform duration-200">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteEntry(${entry.id})" class="text-red-500 hover:text-red-700 transform hover:scale-125 transition-transform duration-200">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        spreadsheetBody.innerHTML = html;
    }
    
    // Calculate and display the monthly total commission
    function calculateMonthlyTotal(data) {
        let filteredData = data;
        
        if (currentMonth !== '0') {
            filteredData = data.filter(entry => {
                const entryMonth = new Date(entry.date).getMonth() + 1;
                return entryMonth.toString() === currentMonth;
            });
        }
        
        const total = filteredData.reduce((sum, entry) => sum + parseFloat(entry.commission), 0);
        monthlyTotal.textContent = formatCurrency(total);
        
        // Highlight the total when it changes
        monthlyTotal.classList.add('active');
        setTimeout(() => {
            monthlyTotal.classList.remove('active');
        }, 1000);
    }
    
    // Calculate days left until forecast date
    function calculateDaysLeft(forecastDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const forecast = new Date(forecastDate);
        const diffTime = forecast - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Format currency to Brazilian Real
    function formatCurrency(value) {
        return 'R$ ' + parseFloat(value).toFixed(2).replace('.', ',');
    }
    
    // Format date to dd/mm/yyyy
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    }
    
    // Get CSS class for status
    function getStatusClass(status) {
        switch(status) {
            case 'pendente': return 'status-pendente';
            case 'concluido': return 'status-concluido';
            case 'cancelado': return 'status-cancelado';
            default: return '';
        }
    }
    
    // Get display text for status
    function getStatusText(status) {
        switch(status) {
            case 'pendente': return 'Pendente';
            case 'concluido': return 'Concluído';
            case 'cancelado': return 'Cancelado';
            default: return status;
        }
    }
    
    // Show error message
    function showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'notification danger';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        notificationsContainer.prepend(errorEl);
    }
    
    // Open modal for new entry
    function newEntry() {
        isEditing = false;
        currentEditId = null;
        modalTitle.textContent = 'Nova Entrada';
        entryForm.reset();
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('forecast').value = today;
        
        entryModal.classList.remove('hidden');
        confettiContainer.classList.add('hidden');
    }
    
    // Open modal for batch entries
    function newBatch() {
        batchModal.classList.remove('hidden');
        addBatchRow(); // Add first empty row
    }
    
    // Add a new row to batch entries table
    function addBatchRow() {
        const row = document.createElement('tr');
        row.className = 'batch-row';
        
        const today = new Date().toISOString().split('T')[0];
        
        row.innerHTML = `
            <td class="px-4 py-2">
                <input type="text" class="w-full p-1 border rounded" placeholder="Nome do cliente" required>
            </td>
            <td class="px-4 py-2">
                <input type="date" class="w-full p-1 border rounded" value="${today}" required>
            </td>
            <td class="px-4 py-2">
                <input type="text" class="w-full p-1 border rounded" placeholder="Produto" required>
            </td>
            <td class="px-4 py-2">
                <input type="number" step="0.01" min="0" class="w-full p-1 border rounded" placeholder="0,00" required>
            </td>
            <td class="px-4 py-2">
                <input type="date" class="w-full p-1 border rounded" value="${today}" required>
            </td>
            <td class="px-4 py-2">
                <select class="w-full p-1 border rounded">
                    <option value="pendente">Pendente</option>
                    <option value="concluido">Concluído</option>
                    <option value="cancelado">Cancelado</option>
                </select>
            </td>
            <td class="px-4 py-2">
                <button class="remove-row">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        batchEntries.appendChild(row);
        
        // Add event to remove button
        row.querySelector('.remove-row').addEventListener('click', () => {
            if (batchEntries.children.length > 1) {
                row.remove();
            }
        });
    }
    
    // Open modal for editing entry
    window.editEntry = async function(id) {
        isEditing = true;
        currentEditId = id;
        modalTitle.textContent = 'Editar Entrada';
        
        try {
            const response = await fetch(`${API_URL}/entries/${id}`);
            const entry = await response.json();
            
            if (entry) {
                document.getElementById('entry-id').value = entry.id;
                document.getElementById('client').value = entry.client;
                document.getElementById('date').value = entry.date.split('T')[0];
                document.getElementById('product').value = entry.product;
                document.getElementById('commission').value = entry.commission;
                document.getElementById('forecast').value = entry.forecast.split('T')[0];
                document.getElementById('status').value = entry.status;
            }
            
            entryModal.classList.remove('hidden');
            confettiContainer.classList.add('hidden');
        } catch (error) {
            console.error('Error fetching entry:', error);
            showError('Erro ao carregar entrada para edição.');
        }
    };
    
    // Delete an entry
    window.deleteEntry = async function(id) {
        if (confirm('Tem certeza que deseja excluir esta entrada?')) {
            try {
                const response = await fetch(`${API_URL}/entries/${id}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    await fetchData();
                    checkNotifications();
                } else {
                    showError('Erro ao excluir entrada.');
                }
            } catch (error) {
                console.error('Error deleting entry:', error);
                showError('Erro ao excluir entrada.');
            }
        }
    };
    
    // Save entry (new or edited)
    async function saveEntry(event) {
        event.preventDefault();
        
        const entry = {
            client: document.getElementById('client').value,
            date: document.getElementById('date').value,
            product: document.getElementById('product').value,
            commission: parseFloat(document.getElementById('commission').value),
            forecast: document.getElementById('forecast').value,
            status: document.getElementById('status').value
        };
        
        try {
            let response;
            
            if (isEditing) {
                response = await fetch(`${API_URL}/entries/${currentEditId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(entry)
                });
            } else {
                response = await fetch(`${API_URL}/entries`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(entry)
                });
                
                if (response.ok) {
                    createConfetti();
                }
            }
            
            if (response.ok) {
                await fetchData();
                checkNotifications();
                closeModal();
            } else {
                showError('Erro ao salvar entrada.');
            }
        } catch (error) {
            console.error('Error saving entry:', error);
            showError('Erro ao salvar entrada.');
        }
    }
    
    // Save batch entries
    async function saveBatch() {
        const rows = batchEntries.querySelectorAll('tr');
        const entries = [];
        
        for (const row of rows) {
            const inputs = row.querySelectorAll('input, select');
            entries.push({
                client: inputs[0].value,
                date: inputs[1].value,
                product: inputs[2].value,
                commission: parseFloat(inputs[3].value),
                forecast: inputs[4].value,
                status: inputs[5].value
            });
        }
        
        try {
            const response = await fetch(`${API_URL}/entries/batch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entries)
            });
            
            if (response.ok) {
                createConfetti();
                await fetchData();
                checkNotifications();
                closeBatchModal();
            } else {
                showError('Erro ao salvar entradas em lote.');
            }
        } catch (error) {
            console.error('Error saving batch entries:', error);
            showError('Erro ao salvar entradas em lote.');
        }
    }
    
    // Create confetti effect
    function createConfetti() {
        confettiContainer.innerHTML = '';
        confettiContainer.classList.remove('hidden');
        
        const colors = ['#ff9eb5', '#ff69b4', '#ff1493', '#ffc0cb', '#ffffff'];
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = -10 + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            
            const animationDuration = Math.random() * 3 + 2;
            confetti.style.animation = `confettiFall ${animationDuration}s ease-in forwards`;
            
            document.styleSheets[0].insertRule(`
                @keyframes confettiFall {
                    0% {
                        opacity: 1;
                        transform: translate(0, 0) rotate(0deg);
                    }
                    100% {
                        opacity: 0;
                        transform: translate(${Math.random() * 200 - 100}px, 100vh) rotate(${Math.random() * 360}deg);
                    }
                }
            `, document.styleSheets[0].cssRules.length);
            
            confettiContainer.appendChild(confetti);
            
            setTimeout(() => {
                confetti.remove();
            }, animationDuration * 1000);
        }
    }
    
    // Close the modal
    function closeModal() {
        entryModal.classList.add('hidden');
        const modal = document.querySelector('#entry-modal > div');
        modal.classList.remove('modal-animation');
        setTimeout(() => {
            modal.classList.add('modal-animation');
        }, 10);
    }
    
    // Close the batch modal
    function closeBatchModal() {
        batchModal.classList.add('hidden');
        batchEntries.innerHTML = ''; // Clear rows
        const modal = document.querySelector('#batch-modal > div');
        modal.classList.remove('modal-animation');
        setTimeout(() => {
            modal.classList.add('modal-animation');
        }, 10);
    }
    
    // Event listeners
    monthSelect.addEventListener('change', function() {
        currentMonth = this.value;
        document.querySelectorAll('.animate__animated').forEach(el => {
            el.classList.remove('animate__fadeIn');
        });
        fetchData();
    });
    
    newEntryBtn.addEventListener('click', newEntry);
    newBatchBtn.addEventListener('click', newBatch);
    closeModalBtn.addEventListener('click', closeModal);
    closeBatchModalBtn.addEventListener('click', closeBatchModal);
    cancelEntryBtn.addEventListener('click', closeModal);
    cancelBatchBtn.addEventListener('click', closeBatchModal);
    addRowBtn.addEventListener('click', addBatchRow);
    saveBatchBtn.addEventListener('click', saveBatch);
    entryForm.addEventListener('submit', saveEntry);
    
    // Add hover effect to buttons
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('animate__animated', 'animate__pulse');
        });
        button.addEventListener('mouseleave', () => {
            setTimeout(() => {
                button.classList.remove('animate__animated', 'animate__pulse');
            }, 1000);
        });
    });
    
    // Initialize the app
    init()

});