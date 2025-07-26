document.addEventListener('DOMContentLoaded', () => {
  const investmentSection = document.getElementById('investment_game');
  const riskSection = document.getElementById('risk_game');
  const socket = window.socket;
  const loadingSpinner = document.getElementById('loading-spinner');

  function showLoading(show) {
      loadingSpinner.style.display = show ? 'flex' : 'none';
  }

  function renderInvestmentGame(data) {
    if (!data.isActive) {
      investmentSection.innerHTML = '<p class="text-center text-gray-400">بازی سرمایه‌گذاری در حال حاضر فعال نیست.</p>';
      return;
    }
    const { game, userContribution } = data;
    investmentSection.innerHTML = `
      <div class="max-w-md mx-auto bg-gray-800 p-6 rounded-lg text-white">
        <h3 class="text-xl font-bold text-center mb-4">بازی سرمایه‌گذاری</h3>
        <div class="mb-4">
          <p>هدف: رسیدن به <span class="font-bold text-yellow-400">${game.threshold}</span> امتیاز</p>
          <p>ضریب برد: <span class="font-bold text-green-400">${game.multiplier}x</span></p>
        </div>
        <div class="mb-4">
          <p>مجموع سرمایه‌گذاری شده: <span id="total-invested" class="font-bold">${game.totalInvested}</span></p>
          <p>سرمایه‌گذاری شما: <span class="font-bold">${userContribution}</span></p>
        </div>
        <div class="flex items-center space-x-2">
          <input type="number" id="investment-amount" class="input-field flex-grow" placeholder="مبلغ سرمایه‌گذاری">
          <button id="invest-btn" class="btn-primary">سرمایه‌گذاری</button>
        </div>
      </div>`;

    document.getElementById('invest-btn').addEventListener('click', async () => {
      const amount = parseInt(document.getElementById('investment-amount').value);
      if (isNaN(amount) || amount <= 0) {
        window.sendNotification('error', 'لطفاً مبلغ معتبری وارد کنید.');
        return;
      }
      try {
        await axios.post('/api/games/investment/invest', { amount });
        window.sendNotification('success', 'سرمایه‌گذاری شما با موفقیت ثبت شد.');
        document.getElementById('investment-amount').value = '';
        fetchInvestmentStatus();
      } catch (error) {
        window.sendNotification('error', error.response?.data?.message || 'خطا در ثبت سرمایه‌گذاری');
      }
    });
  }

  function renderRiskGame(data) {
    if (!data.isActive) {
      riskSection.innerHTML = '<p class="text-center text-gray-400">بازی ریسک در حال حاضر فعال نیست.</p>';
      return;
    }
    const { game, userContribution } = data;
    riskSection.innerHTML = `
      <div class="max-w-md mx-auto bg-gray-800 p-6 rounded-lg text-white">
        <h3 class="text-xl font-bold text-center mb-4">بازی ریسک</h3>
        <div class="mb-4">
          <p>حد ریسک: <span class="font-bold text-red-400">${game.riskLimit}</span> امتیاز</p>
          <p>ضریب برد: <span class="font-bold text-green-400">${game.multiplier}x</span></p>
        </div>
        <div class="mb-4">
          <p>مجموع ریسک شده: <span id="total-risk" class="font-bold">${game.totalRisk}</span></p>
          <p>ریسک شما: <span class="font-bold">${userContribution}</span></p>
        </div>
        <div class="flex items-center space-x-2">
          <input type="number" id="risk-amount" class="input-field flex-grow" placeholder="مبلغ ریسک">
          <button id="risk-btn" class="btn-primary">ریسک</button>
        </div>
      </div>`;

    document.getElementById('risk-btn').addEventListener('click', async () => {
        const amount = parseInt(document.getElementById('risk-amount').value);
        if (isNaN(amount) || amount <= 0) {
            window.sendNotification('error', 'لطفاً مبلغ معتبری وارد کنید.');
            return;
        }
        try {
            await axios.post('/api/games/risk/take', { amount });
            window.sendNotification('success', 'ریسک شما با موفقیت ثبت شد.');
            document.getElementById('risk-amount').value = '';
            fetchRiskStatus();
        } catch (error) {
            window.sendNotification('error', error.response?.data?.message || 'خطا در ثبت ریسک');
        }
    });
  }

  async function fetchInvestmentStatus() {
    showLoading(true);
    try {
      const { data } = await axios.get('/api/games/investment/status');
      renderInvestmentGame(data);
    } catch (error) {
      investmentSection.innerHTML = '<p class="text-center text-red-500">خطا در بارگذاری اطلاعات.</p>';
    } finally {
      showLoading(false);
    }
  }

  async function fetchRiskStatus() {
    showLoading(true);
    try {
      const { data } = await axios.get('/api/games/risk/status');
      renderRiskGame(data);
    } catch (error) {
      riskSection.innerHTML = '<p class="text-center text-red-500">خطا در بارگذاری اطلاعات.</p>';
    } finally {
      showLoading(false);
    }
  }

  // Attach to menu clicks
  document.querySelectorAll('.menu-item').forEach(item => {
    const section = item.dataset.section;
    if (section === 'investment_game') {
      item.addEventListener('click', (e) => { e.preventDefault(); setActiveSection(section); fetchInvestmentStatus(); });
    }
    if (section === 'risk_game') {
      item.addEventListener('click', (e) => { e.preventDefault(); setActiveSection(section); fetchRiskStatus(); });
    }
  });

  // Socket listeners
  socket.on('investmentUpdate', ({ totalInvested }) => {
    const el = document.getElementById('total-invested');
    if (el) el.textContent = totalInvested;
  });

  socket.on('riskUpdate', ({ totalRisk }) => {
    const el = document.getElementById('total-risk');
    if (el) el.textContent = totalRisk;
  });

  socket.on('gameStatusChanged', ({ type }) => {
    if (type === 'investment' && investmentSection.classList.contains('active')) {
      fetchInvestmentStatus();
    }
    if (type === 'risk' && riskSection.classList.contains('active')) {
      fetchRiskStatus();
    }
  });

  // Handle refresh button
  document.getElementById('btn-refresh').addEventListener('click', () => {
    const activeSection = document.querySelector('.content-section.active');
    if (!activeSection) return;

    if (activeSection.id === 'investment_game') {
        fetchInvestmentStatus();
    } else if (activeSection.id === 'risk_game') {
        fetchRiskStatus();
    }
  });
});
