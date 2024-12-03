import { Chart } from './chartConfig.js';

export class PerformanceManager {
    constructor() {
        this.currentView = 'models';
        this.setupEventListeners();
        this.chart = null;
        window.performanceManager = this;
    }

    setupEventListeners() {
        document.querySelectorAll('.view-button').forEach(button => {
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    this.switchView(button.dataset.view);
                }
            });
        });
    
        document.querySelector('.api-buttons').addEventListener('click', (event) => {
            const button = event.target.closest('.api-button');
            if (button && this.currentView === 'performance') {
                // Wait for the active class to be updated
                setTimeout(() => this.loadPerformanceData(), 100);
            }
        });
    
        const modelSelector = document.getElementById('modelSelector');
        if (modelSelector) {
            modelSelector.addEventListener('change', () => this.loadPerformanceData());
        }
    }

    setLoadingState(isLoading) {
        document.querySelectorAll('.view-button').forEach(button => {
            button.disabled = isLoading;
            button.style.opacity = isLoading ? '0.5' : '1';
            button.style.cursor = isLoading ? 'not-allowed' : 'pointer';
        });
    }

    switchView(view) {
        const modelView = document.getElementById('modelView');
        const performanceView = document.getElementById('performanceView');
        
        document.querySelectorAll('.view-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
    
        this.currentView = view;
    
        if (view === 'performance') {
            modelView.style.display = 'none';
            performanceView.style.display = 'block';
            performanceView.classList.add('visible');
            this.loadPerformanceData();
        } else {
            modelView.style.display = 'block';
            performanceView.style.display = 'none';
            performanceView.classList.remove('visible');
        }
    }

    async loadPerformanceData() {
        const performanceData = document.getElementById('performanceData');
        const selectedModel = document.getElementById('modelSelector').value;
        const currentProvider = document.querySelector('.api-button.active')?.dataset.api;
    
        if (!currentProvider) {
            performanceData.innerHTML = '<div class="error">No provider selected</div>';
            return;
        }
    
        performanceData.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner visible"></div>
                <div class="loading-text">Loading performance data for ${currentProvider}...</div>
            </div>
        `;
    
        if (!['rimunace', 'helixmind', 'electronhub', 'nobrandai', 'zukijourney', 'fresedgpt', g4fpro].includes(currentProvider)) {
            setTimeout(() => {
                performanceData.innerHTML = `
                    <div class="loading-container">
                        <div class="under-construction">
                            🚧 Under Construction 🚧<br>
                            Visit <a href="https://cas.zukijourney.com/" target="_blank">https://cas.zukijourney.com/</a> in the meantime
                        </div>
                    </div>
                `;
            }, 500);
            return;
        }
    
        try {
            const response = await fetch(`/.netlify/functions/get-performance?provider=${currentProvider}&model=${selectedModel}`);
            if (!response.ok) {
                throw new Error('Failed to fetch performance data');
            }
            const data = await response.json();
            this.renderPerformanceData(data);
        } catch (error) {
            console.error('Error loading performance data:', error);
            performanceData.innerHTML = `
                <div class="error-container">
                    <div class="error-message">
                        Failed to load performance data for ${currentProvider}
                        <button class="retry-button" onclick="window.performanceManager.loadPerformanceData()">Retry</button>
                    </div>
                </div>`;
        }
    }

    renderPerformanceData(data) {
        const performanceData = document.getElementById('performanceData');
        
        if (!data || !data.results || data.results.length === 0) {
            performanceData.innerHTML = '<div class="under-construction">No performance data available</div>';
            return;
        }

        const metrics = this.calculateMetrics(data.results);
        const latestResult = data.results[0];
        const lastUpdated = new Date(latestResult.timestamp).toLocaleString();
        const lastResponse = latestResult.response?.choices?.[0]?.message?.content || 'No response';
        
        performanceData.innerHTML = `
            <div class="performance-metrics loading">
                <div class="metric-card">
                    <div class="metric-title">Average Response Time</div>
                    <div class="metric-value">${metrics.avgTime.toFixed(2)}ms</div>
                    <div class="metric-subtitle">Last 100 requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Success Rate</div>
                    <div class="metric-value">${metrics.successRate.toFixed(1)}%</div>
                    <div class="metric-subtitle">Based on status codes</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Uptime</div>
                    <div class="metric-value">${metrics.uptime.toFixed(1)}%</div>
                    <div class="metric-subtitle">Last 24 hours</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Error Rate</div>
                    <div class="metric-value">${metrics.errorRate.toFixed(1)}%</div>
                    <div class="metric-subtitle">Last 100 requests</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Last Updated</div>
                    <div class="metric-value timestamp">${lastUpdated}</div>
                    <div class="metric-subtitle">Latest benchmark time</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Last Model Response</div>
                    <div class="metric-value response">${lastResponse}</div>
                    <div class="metric-subtitle">Latest model output</div>
                </div>
            </div>
            <div class="chart-container loading" style="position: relative; height:300px; width:100%">
                <canvas id="performanceChart"></canvas>
            </div>
        `;

        requestAnimationFrame(() => {
            const metrics = performanceData.querySelector('.performance-metrics');
            const chartContainer = performanceData.querySelector('.chart-container');
            
            metrics.classList.remove('loading');
            chartContainer.classList.remove('loading');
        });

        this.renderChart(data.results);
    }

    calculateMetrics(results) {
        const successfulRequests = results.filter(r => r.statusCode === 200);
        const totalTime = successfulRequests.reduce((sum, r) => sum + r.timeTaken, 0);
        
        return {
            avgTime: totalTime / successfulRequests.length,
            successRate: (successfulRequests.length / results.length) * 100,
            uptime: this.calculateUptime(results),
            errorRate: ((results.length - successfulRequests.length) / results.length) * 100
        };
    }

    calculateUptime(results) {
        const last24h = results.filter(r => {
            const timestamp = new Date(r.timestamp);
            const now = new Date();
            return now - timestamp <= 24 * 60 * 60 * 1000;
        });

        const successfulPeriods = last24h.filter(r => r.statusCode === 200);
        return (successfulPeriods.length / Math.max(last24h.length, 1)) * 100;
    }

    renderChart(results) {
        if (this.chart) {
            this.chart.destroy();
        }
    
        const ctx = document.getElementById('performanceChart').getContext('2d');
        const timestamps = results.map(r => new Date(r.timestamp).toLocaleTimeString()).reverse();
        const responseTimes = results.map(r => r.timeTaken).reverse();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timestamps,
                datasets: [{
                    label: 'Response Time (ms)',
                    data: responseTimes,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.4,
                    fill: {
                        target: 'origin',
                        above: 'rgba(75, 192, 192, 0.1)'
                    },
                    backgroundColor: 'rgba(75, 192, 192, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff'
                        }
                    },
                    filler: {
                        propagate: true
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#aaa',
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#aaa'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                }
            }
        });
    }
} 