// MessMate NEXT - Main Application Logic

// Global State
let appData = {
  userProfile: null,
  currentCycle: null,
  history: [],
  settings: {
    theme: 'dark',
    notifications: false
  }
};

let currentView = 'meals';
let pieChart = null;

// Initialize App
function initApp() {
  // Hide splash screen after 2 seconds
  setTimeout(() => {
    document.getElementById('splash-screen').style.display = 'none';
    
    // Load data from localStorage
    loadData();
    
    // Check if setup is needed
    if (!appData.userProfile || !appData.currentCycle) {
      showSetup();
    } else {
      showApp();
    }
  }, 2000);
  
  // Setup event listeners
  setupEventListeners();
  
  // Apply saved theme
  applyTheme(appData.settings.theme);
}

// Load data from in-memory storage (localStorage not available in sandbox)
function loadData() {
  // Data is already initialized in global state
  // In production, this would load from localStorage
}

// Save data (in-memory only - localStorage not available in sandbox)
function saveData() {
  // Data is automatically saved in memory
  // In production, this would use localStorage
}

// Show setup modal
function showSetup() {
  document.getElementById('setup-modal').style.display = 'flex';
  
  // Set default start date to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('start-date').value = today;
}

// Show main app
function showApp() {
  document.getElementById('app').style.display = 'block';
  renderMealsView();
  updateQuickStats();
  loadSettingsForm();
  updateCycleInfo();
}

// Setup event listeners
function setupEventListeners() {
  // Setup form
  document.getElementById('setup-form').addEventListener('submit', handleSetup);
  
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const view = e.currentTarget.getAttribute('data-view');
      switchView(view);
    });
  });
  
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('theme-switch').addEventListener('change', toggleTheme);
  
  // FAB
  document.getElementById('fab-report').addEventListener('click', generatePDF);
  
  // Settings buttons
  document.getElementById('save-profile').addEventListener('click', saveProfile);
  document.getElementById('end-cycle').addEventListener('click', showEndCycleModal);
  document.getElementById('backup-data').addEventListener('click', backupData);
  document.getElementById('restore-data').addEventListener('click', () => {
    document.getElementById('restore-file').click();
  });
  document.getElementById('restore-file').addEventListener('change', restoreData);
  document.getElementById('clear-data').addEventListener('click', clearData);
  document.getElementById('export-stats').addEventListener('click', generatePDF);
  
  // Cycle modal
  document.getElementById('download-report').addEventListener('click', generatePDF);
  document.getElementById('confirm-new-cycle').addEventListener('click', confirmNewCycle);
  document.getElementById('cancel-end-cycle').addEventListener('click', () => {
    document.getElementById('cycle-modal').style.display = 'none';
  });
}

// Handle setup form submission
function handleSetup(e) {
  e.preventDefault();
  
  const name = document.getElementById('user-name').value;
  const messName = document.getElementById('mess-name').value;
  const startDate = document.getElementById('start-date').value;
  const monthlyRate = parseFloat(document.getElementById('monthly-rate').value);
  let perMealRate = parseFloat(document.getElementById('per-meal-rate').value);
  
  // Calculate per meal rate if not provided
  if (!perMealRate || perMealRate === 0) {
    perMealRate = (monthlyRate / 87).toFixed(2);
  }
  
  // Create user profile
  appData.userProfile = {
    name,
    messName,
    monthlyRate,
    perMealRate,
    startDate,
    extensionDays: 0
  };
  
  // Generate first cycle
  generateCycle(startDate);
  
  // Save and show app
  saveData();
  document.getElementById('setup-modal').style.display = 'none';
  showApp();
  showToast('Welcome to MessMate NEXT! 🎉');
}

// Generate meal cycle
function generateCycle(startDate) {
  const start = new Date(startDate);
  const meals = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
    const dateStr = date.toISOString().split('T')[0];
    
    const mealDay = {
      id: `meal-${i}`,
      date: dateStr,
      dayName,
      breakfast: null,
      lunch: { status: 'pending', timestamp: new Date().toISOString() },
      dinner: null
    };
    
    // Mon-Sat: all meals, Sunday: lunch only
    if (dayName !== 'Sunday') {
      mealDay.breakfast = { status: 'pending', timestamp: new Date().toISOString() };
      mealDay.dinner = { status: 'pending', timestamp: new Date().toISOString() };
    }
    
    meals.push(mealDay);
  }
  
  const endDate = new Date(start);
  endDate.setDate(endDate.getDate() + 29);
  
  appData.currentCycle = {
    cycleId: `cycle-${Date.now()}`,
    startDate,
    endDate: endDate.toISOString().split('T')[0],
    meals
  };
}

// Render meals view
function renderMealsView() {
  const container = document.getElementById('meal-calendar');
  container.innerHTML = '';
  
  if (!appData.currentCycle || !appData.currentCycle.meals) {
    container.innerHTML = '<p>No meals to display</p>';
    return;
  }
  
  appData.currentCycle.meals.forEach(day => {
    const dayCard = document.createElement('div');
    dayCard.className = 'day-card';
    
    const date = new Date(day.date);
    const formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    
    let mealsHTML = '';
    
    if (day.breakfast) {
      mealsHTML += createMealHTML(day.id, 'breakfast', day.breakfast, '🌅');
    }
    if (day.lunch) {
      mealsHTML += createMealHTML(day.id, 'lunch', day.lunch, '☀️');
    }
    if (day.dinner) {
      mealsHTML += createMealHTML(day.id, 'dinner', day.dinner, '🌙');
    }
    
    dayCard.innerHTML = `
      <div class="day-header">${formattedDate}</div>
      <div class="meals-list">${mealsHTML}</div>
    `;
    
    container.appendChild(dayCard);
  });
  
  // Add click listeners to meal items
  document.querySelectorAll('.meal-item').forEach(item => {
    item.addEventListener('click', handleMealClick);
  });
}

// Create meal HTML
function createMealHTML(dayId, mealType, mealData, icon) {
  const status = mealData.status;
  const statusText = {
    'pending': 'Pending',
    'taken': 'Taken',
    'cancelled-user': 'Missed',
    'cancelled-owner': 'Owner'
  }[status];
  
  const capitalizedMeal = mealType.charAt(0).toUpperCase() + mealType.slice(1);
  
  return `
    <div class="meal-item status-${status}" data-day="${dayId}" data-meal="${mealType}">
      <div class="meal-info">
        <span class="meal-icon">${icon}</span>
        <span class="meal-name">${capitalizedMeal}</span>
      </div>
      <div class="meal-status">
        <span class="status-dot" style="background: var(--status-${status})"></span>
        <span>${statusText}</span>
      </div>
    </div>
  `;
}

// Handle meal click
function handleMealClick(e) {
  const dayId = e.currentTarget.getAttribute('data-day');
  const mealType = e.currentTarget.getAttribute('data-meal');
  
  toggleMealStatus(dayId, mealType);
}

// Toggle meal status
function toggleMealStatus(dayId, mealType) {
  const day = appData.currentCycle.meals.find(d => d.id === dayId);
  if (!day || !day[mealType]) return;
  
  const currentStatus = day[mealType].status;
  // FIX: Added 'cancelled-owner' to the status cycle
  const statusCycle = ['pending', 'taken', 'cancelled-user', 'cancelled-owner', 'pending'];
  const nextStatus = statusCycle[statusCycle.indexOf(currentStatus) + 1];
  
  day[mealType].status = nextStatus;
  day[mealType].timestamp = new Date().toISOString();
  
  saveData();
  renderMealsView();
  updateQuickStats();
  
  // FIX: Added 'cancelled-owner' to the toast message names
  const statusNames = {
    'pending': 'Pending',
    'taken': 'Taken ✓',
    'cancelled-user': 'Cancelled by You',
    'cancelled-owner': 'Cancelled by Owner'
  };
  
  showToast(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} marked as ${statusNames[nextStatus]}`);
}

// Update quick stats
function updateQuickStats() {
  const stats = calculateStats();
  
  document.getElementById('stat-taken').textContent = stats.taken;
  document.getElementById('stat-missed').textContent = stats.missedByUser;
  document.getElementById('stat-owner').textContent = stats.cancelledByOwner;
  document.getElementById('stat-pending').textContent = stats.pending;
}

// Calculate statistics
function calculateStats() {
  let totalMeals = 0;
  let taken = 0;
  let missedByUser = 0;
  let cancelledByOwner = 0;
  let pending = 0;
  
  if (appData.currentCycle && appData.currentCycle.meals) {
    appData.currentCycle.meals.forEach(day => {
      ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
        if (day[mealType]) {
          totalMeals++;
          const status = day[mealType].status;
          if (status === 'taken') taken++;
          else if (status === 'cancelled-user') missedByUser++;
          else if (status === 'cancelled-owner') cancelledByOwner++;
          else if (status === 'pending') pending++;
        }
      });
    });
  }
  
  const takenPercentage = totalMeals > 0 ? ((taken / totalMeals) * 100).toFixed(1) : 0;
  const missedPercentage = totalMeals > 0 ? ((missedByUser / totalMeals) * 100).toFixed(1) : 0;
  const extensionDays = Math.floor(missedByUser / 3);
  
  let moneyOwed = 0;
  if (appData.userProfile) {
    moneyOwed = (taken * appData.userProfile.perMealRate) - appData.userProfile.monthlyRate;
  }
  
  return {
    totalMeals,
    taken,
    missedByUser,
    cancelledByOwner,
    pending,
    takenPercentage,
    missedPercentage,
    extensionDays,
    moneyOwed
  };
}

// Update cycle info
function updateCycleInfo() {
  if (!appData.currentCycle) return;
  
  const today = new Date();
  const endDate = new Date(appData.currentCycle.endDate);
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
  document.getElementById('cycle-info-text').textContent = `Days Remaining: ${daysRemaining}`;
}

// Switch view
function switchView(view) {
  currentView = view;
  
  // Hide all views
  document.querySelectorAll('.view-container').forEach(v => {
    v.classList.remove('active');
  });
  
  // Show selected view
  document.getElementById(`${view}-view`).classList.add('active');
  
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`).classList.add('active');
  
  // Load view-specific content
  if (view === 'stats') {
    renderStatsView();
  }
}

// Render stats view
function renderStatsView() {
  const stats = calculateStats();
  
  document.getElementById('metric-total').textContent = stats.totalMeals;
  document.getElementById('metric-taken-count').textContent = stats.taken;
  document.getElementById('metric-taken-pct').textContent = `${stats.takenPercentage}%`;
  document.getElementById('metric-missed-count').textContent = stats.missedByUser;
  document.getElementById('metric-missed-pct').textContent = `${stats.missedPercentage}%`;
  document.getElementById('metric-owner-count').textContent = stats.cancelledByOwner;
  
  const moneyText = stats.moneyOwed >= 0 ? `₹${stats.moneyOwed.toFixed(2)}` : `Saved ₹${Math.abs(stats.moneyOwed).toFixed(2)}`;
  document.getElementById('metric-money').textContent = moneyText;
  document.getElementById('metric-money-label').textContent = stats.moneyOwed >= 0 ? 'Amount Owed' : 'Amount Saved';
  
  // Render pie chart
  renderPieChart(stats);
}

// Render pie chart
function renderPieChart(stats) {
  const ctx = document.getElementById('pie-chart');
  if (!ctx) return;
  
  if (pieChart) {
    pieChart.destroy();
  }
  
  const isDark = appData.settings.theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#1C1C1C';
  
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Taken', 'Missed', 'Owner Cancelled', 'Pending'],
      datasets: [{
        data: [stats.taken, stats.missedByUser, stats.cancelledByOwner, stats.pending],
        backgroundColor: ['#22CC88', '#FF4444', '#FFA600', isDark ? '#2F2F2F' : '#E0E0E0'],
        borderWidth: 2,
        borderColor: isDark ? '#1C1C1C' : '#FFFFFF'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: textColor,
            padding: 15,
            font: {
              size: 12
            }
          }
        },
        tooltip: {
          backgroundColor: isDark ? '#2F2F2F' : '#FFFFFF',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: isDark ? '#3F3F3F' : '#E0E0E0',
          borderWidth: 1
        }
      }
    }
  });
}

// Toggle theme
function toggleTheme() {
  const newTheme = appData.settings.theme === 'dark' ? 'light' : 'dark';
  appData.settings.theme = newTheme;
  applyTheme(newTheme);
  saveData();
  
  // Re-render chart if on stats view
  if (currentView === 'stats') {
    renderStatsView();
  }
}

// Apply theme
function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light-theme');
    document.getElementById('theme-switch').checked = true;
    document.querySelector('.theme-icon').textContent = '☀️';
  } else {
    document.body.classList.remove('light-theme');
    document.getElementById('theme-switch').checked = false;
    document.querySelector('.theme-icon').textContent = '🌙';
  }
}

// Load settings form
function loadSettingsForm() {
  if (!appData.userProfile) return;
  
  document.getElementById('settings-name').value = appData.userProfile.name;
  document.getElementById('settings-mess').value = appData.userProfile.messName;
  document.getElementById('settings-monthly').value = appData.userProfile.monthlyRate;
  document.getElementById('settings-per-meal').value = appData.userProfile.perMealRate;
}

// Save profile
function saveProfile() {
  appData.userProfile.name = document.getElementById('settings-name').value;
  appData.userProfile.messName = document.getElementById('settings-mess').value;
  appData.userProfile.monthlyRate = parseFloat(document.getElementById('settings-monthly').value);
  appData.userProfile.perMealRate = parseFloat(document.getElementById('settings-per-meal').value);
  
  saveData();
  showToast('Profile saved successfully ✓');
}

// Show end cycle modal
function showEndCycleModal() {
  const stats = calculateStats();
  
  const summaryHTML = `
    <p><strong>Total Meals:</strong> <span>${stats.totalMeals}</span></p>
    <p><strong>Meals Taken:</strong> <span>${stats.taken} (${stats.takenPercentage}%)</span></p>
    <p><strong>Meals Missed:</strong> <span>${stats.missedByUser} (${stats.missedPercentage}%)</span></p>
    <p><strong>Owner Cancelled:</strong> <span>${stats.cancelledByOwner}</span></p>
    <p><strong>Extension Days Earned:</strong> <span>${stats.extensionDays}</span></p>
    <p><strong>Money:</strong> <span>${stats.moneyOwed >= 0 ? `Owed ₹${stats.moneyOwed.toFixed(2)}` : `Saved ₹${Math.abs(stats.moneyOwed).toFixed(2)}`}</span></p>
  `;
  
  document.getElementById('summary-content').innerHTML = summaryHTML;
  document.getElementById('cycle-modal').style.display = 'flex';
}

// Confirm new cycle
function confirmNewCycle() {
  // Save current cycle to history
  if (appData.currentCycle) {
    appData.history.push({
      ...appData.currentCycle,
      completedAt: new Date().toISOString()
    });
  }
  
  // Calculate extension days
  const stats = calculateStats();
  appData.userProfile.extensionDays += stats.extensionDays;
  
  // Generate new cycle
  const lastEndDate = new Date(appData.currentCycle.endDate);
  lastEndDate.setDate(lastEndDate.getDate() + 1);
  generateCycle(lastEndDate.toISOString().split('T')[0]);
  
  saveData();
  document.getElementById('cycle-modal').style.display = 'none';
  renderMealsView();
  updateQuickStats();
  updateCycleInfo();
  showToast('New cycle started successfully! 🎉');
}

// Generate PDF report
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const stats = calculateStats();
  
  // Header
  doc.setFontSize(20);
  doc.text('MessMate NEXT - Monthly Report', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Name: ${appData.userProfile.name}`, 20, 35);
  doc.text(`Mess: ${appData.userProfile.messName}`, 20, 42);
  doc.text(`Cycle: ${appData.currentCycle.startDate} to ${appData.currentCycle.endDate}`, 20, 49);
  
  // Summary
  doc.setFontSize(14);
  doc.text('Summary', 20, 65);
  
  doc.setFontSize(11);
  let y = 75;
  doc.text(`Total Meals: ${stats.totalMeals}`, 25, y);
  y += 7;
  doc.text(`Meals Taken: ${stats.taken} (${stats.takenPercentage}%)`, 25, y);
  y += 7;
  doc.text(`Meals Missed: ${stats.missedByUser} (${stats.missedPercentage}%)`, 25, y);
  y += 7;
  doc.text(`Owner Cancelled: ${stats.cancelledByOwner}`, 25, y);
  y += 7;
  doc.text(`Extension Days Earned: ${stats.extensionDays}`, 25, y);
  y += 7;
  const moneyText = stats.moneyOwed >= 0 ? `Amount Owed: ₹${stats.moneyOwed.toFixed(2)}` : `Savings: ₹${Math.abs(stats.moneyOwed).toFixed(2)}`;
  doc.text(moneyText, 25, y);
  
  // Daily log header
  y += 15;
  doc.setFontSize(14);
  doc.text('Daily Log', 20, y);
  
  y += 10;
  doc.setFontSize(9);
  doc.text('Date', 20, y);
  doc.text('Day', 50, y);
  doc.text('Breakfast', 85, y);
  doc.text('Lunch', 120, y);
  doc.text('Dinner', 150, y);
  
  // Daily meals
  y += 5;
  appData.currentCycle.meals.forEach(day => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    
    const statusSymbol = (meal) => {
      if (!meal) return '—';
      return {
        'taken': '✓',
        'cancelled-user': '✗',
        'cancelled-owner': '⊘',
        'pending': '○'
      }[meal.status] || '—';
    };
    
    doc.text(day.date, 20, y);
    doc.text(day.dayName.substring(0, 3), 50, y);
    doc.text(statusSymbol(day.breakfast), 95, y);
    doc.text(statusSymbol(day.lunch), 130, y);
    doc.text(statusSymbol(day.dinner), 160, y);
    y += 6;
  });
  
  // Footer
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Generated by MessMate NEXT v1.0.0 on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
  }
  
  // Download
  const filename = `MessMate_Report_${appData.currentCycle.startDate}.pdf`;
  doc.save(filename);
  showToast('Report downloaded successfully! 📄');
}

// Backup data
function backupData() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `messmate_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup created successfully! 💾');
}

// Restore data
function restoreData(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      
      // Validate structure
      if (data.userProfile && data.currentCycle) {
        appData = data;
        saveData();
        loadSettingsForm();
        renderMealsView();
        updateQuickStats();
        updateCycleInfo();
        showToast('Data restored successfully! ✓');
      } else {
        showToast('Invalid backup file!');
      }
    } catch (err) {
      console.error('Restore error:', err);
      showToast('Failed to restore data!');
    }
  };
  reader.readText(file);
  
  // Reset file input
  e.target.value = '';
}

// Clear all data
function clearData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
    // Reset to initial state
    appData = {
      userProfile: null,
      currentCycle: null,
      history: [],
      settings: {
        theme: 'dark',
        notifications: false
      }
    };
    location.reload();
  }
}

// Show toast notification
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered:', reg))
      .catch(err => console.log('Service Worker registration failed:', err));
  });
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}