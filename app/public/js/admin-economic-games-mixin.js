const adminEconomicGamesMixin = {
  data: {
    investmentGame: null,
    riskGame: null,
    investmentForm: {
      threshold: 1000,
      multiplier: 1.5,
    },
    riskForm: {
      riskLimit: 500,
      multiplier: 1.2,
    },
  },
  methods: {
    async fetchEconomicGamesStatus() {
      try {
        const { data } = await axios.get('/admin/api/games/status');
        this.investmentGame = data.investmentGame;
        this.riskGame = data.riskGame;
      } catch (error) {
        console.error('Error fetching games status:', error);
        this.sendNotification('error', 'خطا در دریافت وضعیت بازی‌ها');
      }
    },
    async startInvestmentGame() {
      this.setLoadingState(true);
      try {
        await axios.post('/admin/api/games/investment/start', this.investmentForm);
        this.sendNotification('success', 'بازی سرمایه‌گذاری با موفقیت شروع شد.');
        this.fetchEconomicGamesStatus();
      } catch (error) {
        this.sendNotification('error', 'خطا در شروع بازی سرمایه‌گذاری.');
      } finally {
        this.setLoadingState(false);
      }
    },
    async endInvestmentGame() {
      if (!confirm('آیا از پایان دادن به بازی سرمایه‌گذاری مطمئن هستید؟')) return;
      this.setLoadingState(true);
      try {
        await axios.post('/admin/api/games/investment/end');
        this.sendNotification('success', 'بازی سرمایه‌گذاری پایان یافت.');
        this.fetchEconomicGamesStatus();
      } catch (error) {
        this.sendNotification('error', 'خطا در پایان دادن به بازی.');
      } finally {
        this.setLoadingState(false);
      }
    },
    async startRiskGame() {
      this.setLoadingState(true);
      try {
        await axios.post('/admin/api/games/risk/start', this.riskForm);
        this.sendNotification('success', 'بازی ریسک با موفقیت شروع شد.');
        this.fetchEconomicGamesStatus();
      } catch (error) {
        this.sendNotification('error', 'خطا در شروع بازی ریسک.');
      } finally {
        this.setLoadingState(false);
      }
    },
    async endRiskGame() {
      if (!confirm('آیا از پایان دادن به بازی ریسک مطمئن هستید؟')) return;
      this.setLoadingState(true);
      try {
        await axios.post('/admin/api/games/risk/end');
        this.sendNotification('success', 'بازی ریسک پایان یافت.');
        this.fetchEconomicGamesStatus();
      } catch (error) {
        this.sendNotification('error', 'خطا در پایان دادن به بازی.');
      } finally {
        this.setLoadingState(false);
      }
    },
    handleGameSocketEvents() {
        window.socket.on('investmentUpdate', ({ totalInvested }) => {
            if (this.investmentGame) this.investmentGame.totalInvested = totalInvested;
        });
        window.socket.on('riskUpdate', ({ totalRisk }) => {
            if (this.riskGame) this.riskGame.totalRisk = totalRisk;
        });
        window.socket.on('gameStatusChanged', () => {
            if (this.activeSection === 'economic_games') {
                this.fetchEconomicGamesStatus();
            }
        });
    }
  },
  created() {
      this.handleGameSocketEvents();
  }
};
