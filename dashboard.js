class DashboardManager {
    constructor() {
        this.charts = {};
        this.isUpdating = false;
        this.API_BASE_URL = 'http://127.0.0.1:5000/api'; // Base URL for Flask API
        this.initializeDashboard();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('questionInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleQuestion();
            }
        });

        window.addEventListener('error', (e) => {
            console.error('Dashboard error:', e);
            this.showResponseMessage('An error occurred. Please refresh the page.');
        });
    }

    async fetchData(endpoint) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/${endpoint}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Failed to fetch ${endpoint}:`, error);
            this.showResponseMessage(`Failed to fetch ${endpoint} data`);
            throw error;
        }
    }

    getChartConfig(type) {
        const baseConfig = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeInOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement)
                            .getPropertyValue('--text-primary'),
                        font: { size: 14 }
                    }
                },


                datalabels: {
                    formatter: (value, ctx) => {
                        let sum = 0;
                        let dataArr = ctx.chart.data.datasets[0].data;
                        dataArr.map(data => {
                            sum += data;
                        });
                        let percentage = ((value / sum) * 100).toFixed(2) + '%';
                        return percentage;
                    },
                    color: '#fff',
                }



                ,
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: { size: 14 },
                    bodyFont: { size: 13 }
                }
            }
        };

        if (type === 'bar') {
            return {
                ...baseConfig,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-primary'),
                            font: { size: 12 }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement)
                                .getPropertyValue('--text-primary'),
                            font: { size: 12 }
                        }
                    }
                }
            };
        }
        return baseConfig;
    }



    async initializeDashboard() {
        try {
            const [chartData, statsResponse] = await Promise.all([
                this.fetchData('chart-data'),
                this.fetchData('analytics')
            ]);

            const statsData = statsResponse.data;

            await this.createCharts(chartData.data);
            this.updateStats(statsData);
            const insights = this.generateInsights();
            this.updateInsights(insights);
            this.showResponseMessage('Dashboard initialized successfully');
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showResponseMessage('Failed to initialize dashboard');
        }
    }

    showResponseMessage(message, duration = 3000) {
        const messageElement = document.getElementById('responseMessage');
        messageElement.textContent = message;
        messageElement.classList.add('show');
        setTimeout(() => messageElement.classList.remove('show'), duration);
    }

    async handleQuestion() {
        const input = document.getElementById('questionInput');
        const question = input.value.trim();
        const loading = document.getElementById('loading');

        if (!question) {
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 500);
            return;
        }

        loading.classList.add('show');
        this.showResponseMessage('Analyzing your question...');

        try {
            const response = await fetch(`${this.API_BASE_URL}/ask-ai`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();

            const responseArea = document.getElementById('aiResponseArea');
            const responseContent = document.getElementById('aiResponseContent');

            responseContent.innerHTML = data.response;
            responseArea.classList.add('show');

            this.showResponseMessage('Analysis complete!');
            input.value = '';
        } catch (error) {
            console.error('Question processing failed:', error);
            this.showResponseMessage('Failed to process question. Please try again.');
        } finally {
            loading.classList.remove('show');
        }
    }

    async createCharts(chartData) {

        const colors = {
            primary: getComputedStyle(document.documentElement)
                .getPropertyValue('--primary-color'),
            secondary: getComputedStyle(document.documentElement)
                .getPropertyValue('--secondary-color'),
            accent: getComputedStyle(document.documentElement)
                .getPropertyValue('--accent-color')
        };

        const createChart = (ctx, chartType, chartId) => {
            const chart = Chart.getChart(chartId);
            if (chart) {
                chart.destroy();
            }

            switch (chartType) {
                case 'bar':
                    this.charts[chartType] = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: chartData.engagement.labels,
                            datasets: [{
                                label: 'Engagement by Post Type',
                                data: chartData.engagement.datasets[0].data,
                                backgroundColor: [
                                    colors.primary + 'B3',
                                    colors.secondary + 'B3',
                                    colors.accent + 'B3'
                                ],
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: 2
                            }]
                        },
                        options: this.getChartConfig('bar')
                    });
                    break;
                case 'pie':
                    this.charts[chartType] = new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: chartData.distribution.labels,
                            datasets: [{
                                data: chartData.distribution.datasets[0].data,
                                backgroundColor: [
                                    colors.primary + 'B3',
                                    colors.secondary + 'B3',
                                    colors.accent + 'B3'
                                ],
                                borderColor: 'rgba(255, 255, 255, 0.1)',
                                borderWidth: 2
                            }]
                        },
                        options: this.getChartConfig('pie')
                    });
                    break;
            }
        };

        const barCtx = document.getElementById('postTypeBarChart');
        const pieCtx = document.getElementById('postTypeChart');

        if (barCtx && pieCtx) {
            createChart(barCtx.getContext('2d'), 'bar', 'postTypeBarChart');
            createChart(pieCtx.getContext('2d'), 'pie', 'postTypeChart');
        } else {
            console.error('Chart canvas not found');
        }
    }



    updateStats(statsData) {
        if (this.isUpdating) return;

        console.log('Received stats data:', statsData); // Add this line

        const formatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short'
        });

        document.getElementById('engagementRate').textContent =
            `${statsData.engagement_rate.toFixed(1)}%`;
        document.getElementById('totalInteractions').textContent =
            formatter.format(statsData.total_interactions);
        document.getElementById('bestPerforming').textContent =
            statsData.best_performing;
    }

    generateInsights() {
        const formatter = new Intl.NumberFormat('en-US', {
            notation: 'compact',
            compactDisplay: 'short'
        });

        return [
            {
                icon: 'fa-chart-line',
                text: `Engagement rate increased by ${(Math.random() * 15 + 5).toFixed(1)}% this week`
            },
            {
                icon: 'fa-video',
                text: `${document.getElementById('bestPerforming').textContent} perform ${(Math.random() * 2 + 1.5).toFixed(1)}x better than other content`
            },
            {
                icon: 'fa-heart',
                text: `Average likes per post: ${formatter.format(Math.floor(Math.random() * 500 + 300))}`
            }
        ];
    }

    updateInsights(insights) {
        if (this.isUpdating) return;

        const insightsList = document.getElementById('insightsList');

        const insightElements = insights.map(insight => {
            const div = document.createElement('div');
            div.className = 'insight-item';
            div.innerHTML = `
                <i class="fas ${insight.icon}"></i>
                <span>${insight.text}</span>
            `;
            return div;
        });

        insightsList.innerHTML = '';
        insightElements.forEach(element => insightsList.appendChild(element));
    }

    async updateDashboard() {
        if (this.isUpdating) return;
        this.isUpdating = true;

        try {
            const [chartData, statsResponse] = await Promise.all([
                this.fetchData('chart-data'),
                this.fetchData('analytics')
            ]);

            console.log('Received stats response:', statsResponse); // Add this line

            await this.createCharts(chartData.data);
            this.updateStats(statsResponse.data);
            const insights = this.generateInsights();
            this.updateInsights(insights);
            this.showResponseMessage('Dashboard updated successfully!');
        } catch (error) {
            console.error('Dashboard update failed:', error);
            this.showResponseMessage('Failed to update dashboard. Please try again.');
        } finally {
            this.isUpdating = false;
        }
    }


}

class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                '--bg-dark': '#060714',
                '--primary-color': '#00ffff',
                '--secondary-color': '#00ff9d',
                '--text-primary': '#ffffff',
                '--text-secondary': 'rgba(255, 255, 255, 0.7)'
            },
            light: {
                '--bg-dark': '#f5f5f5',
                '--primary-color': '#0066cc',
                '--secondary-color': '#00994d',
                '--text-primary': '#333333',
                '--text-secondary': 'rgba(0, 0, 0, 0.7)'
            }
        };
        this.currentTheme = 'dark';
        this.initializeThemeToggle();
    }

    initializeThemeToggle() {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'theme-btn';
        themeBtn.setAttribute('aria-label', 'Toggle theme');
        themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        themeBtn.onclick = () => this.toggleTheme();
        document.querySelector('.container').appendChild(themeBtn);
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        const theme = this.themes[this.currentTheme];

        Object.entries(theme).forEach(([property, value]) => {
            document.documentElement.style.setProperty(property, value);
        });

        // Update charts with new theme colors
        if (window.dashboardManager) {
            window.dashboardManager.createCharts();
        }
    }
}

class SearchManager {
    constructor() {
        this.initializeSearch();
    }

    initializeSearch() {
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'search-input';
        searchInput.placeholder = 'Search insights...';
        searchInput.setAttribute('aria-label', 'Search insights');
        searchInput.oninput = (e) => this.handleSearch(e.target.value);

        const container = document.querySelector('.insights');
        //container.insertBefore(searchInput, container.firstChild);
    }

    handleSearch(query) {
        const insights = document.querySelectorAll('.insight-item');
        query = query.toLowerCase();

        insights.forEach(insight => {
            const text = insight.textContent.toLowerCase();
            insight.style.display = text.includes(query) ? 'flex' : 'none';
        });
    }
}

// Global function handlers
function handleQuestion() {
    window.dashboardManager.handleQuestion();
}

function refreshDashboard() {
    window.dashboardManager.updateDashboard();
}

// Initialize dashboard
window.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
    new ThemeManager();
    new SearchManager();
});

// Auto-refresh every 5 minutes
let refreshInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
        window.dashboardManager.updateDashboard();
    }
}, 300000);

// Clean up interval on page unload
window.addEventListener('beforeunload', () => {
    clearInterval(refreshInterval);
});

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        clearInterval(refreshInterval);
    } else {
        refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                window.dashboardManager.updateDashboard();
            }
        }, 300000);
    }
});

// Handle network status
window.addEventListener('online', () => {
    window.dashboardManager.showResponseMessage('Connection restored');
    window.dashboardManager.updateDashboard();
});

window.addEventListener('offline', () => {
    window.dashboardManager.showResponseMessage('Connection lost');
});

// Handle errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    window.dashboardManager.showResponseMessage('An error occurred. Please refresh the page.');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    window.dashboardManager.showResponseMessage('An error occurred. Please refresh the page.');
});