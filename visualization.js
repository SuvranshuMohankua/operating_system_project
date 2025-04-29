class Visualizer {
    constructor() {
        this.energyChart = null;
        this.colors = [
            '#007bff', '#28a745', '#dc3545', '#ffc107', 
            '#17a2b8', '#6610f2', '#fd7e14', '#20c997'
        ];
        this.algorithmColors = {
            'fcfs': '#007bff',
            'rr': '#28a745',
            'energy': '#dc3545'
        };
    }

    drawGanttCharts(results) {
        const container = document.getElementById('ganttChartsContainer');
        container.innerHTML = '';
        
        results.forEach((result, index) => {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'gantt-chart-container mb-4';
            
            const title = document.createElement('h5');
            title.textContent = this.getAlgorithmName(result.algorithm);
            chartDiv.appendChild(title);
            
            const ganttChart = document.createElement('div');
            ganttChart.className = 'gantt-chart';
            ganttChart.style.height = '150px';
            ganttChart.style.position = 'relative';
            
            const timelineWidth = Math.max(800, result.timeline[result.timeline.length - 1].end * 40);
            ganttChart.style.width = `${timelineWidth}px`;
            
            const chartContainer = document.createElement('div');
            chartContainer.style.position = 'relative';
            chartContainer.style.height = '100%';
            
            result.timeline.forEach((event, i) => {
                const duration = event.end - event.start;
                const bar = document.createElement('div');
                
                bar.className = `gantt-bar ${event.id === 'idle' ? 'idle-bar' : 'process-bar'}`;
                bar.style.position = 'absolute';
                bar.style.left = `${event.start * 40}px`;
                bar.style.width = `${duration * 40}px`;
                
                if (event.id !== 'idle') {
                    bar.style.backgroundColor = this.colors[parseInt(event.id.replace('P', '')) % this.colors.length];
                    const speedInfo = event.speed ? ` (${Math.round(event.speed * 100)}%)` : '';
                    bar.textContent = `${event.id}${speedInfo}`;
                } else {
                    bar.textContent = 'Idle';
                }
                
                bar.title = `${event.id}: ${event.start} - ${event.end}`;
                chartContainer.appendChild(bar);
            });
            
            // Add time markers
            const lastTime = result.timeline[result.timeline.length - 1].end;
            for (let t = 0; t <= lastTime; t += 2) {
                const marker = document.createElement('div');
                marker.style.position = 'absolute';
                marker.style.left = `${t * 40}px`;
                marker.style.top = '45px';
                marker.style.borderLeft = '1px solid #dee2e6';
                marker.style.height = '10px';
                marker.textContent = t.toString();
                marker.style.fontSize = '12px';
                chartContainer.appendChild(marker);
            }
            
            ganttChart.appendChild(chartContainer);
            chartDiv.appendChild(ganttChart);
            container.appendChild(chartDiv);
        });
    }

    drawEnergyComparisonChart(results) {
        const ctx = document.getElementById('energyChart').getContext('2d');
        
        if (this.energyChart) {
            this.energyChart.destroy();
        }

        const algorithms = results.map(r => this.getAlgorithmName(r.algorithm));
        const energyData = results.map(r => r.metrics.totalEnergyUsed);
        const backgroundColors = results.map(r => this.algorithmColors[r.algorithm]);

        this.energyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: algorithms,
                datasets: [{
                    label: 'Total Energy Usage (Units)',
                    data: energyData,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Energy Units'
                        }
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'Energy Consumption Comparison'
                    }
                }
            }
        });
    }

    updateMetricsTable(results) {
        const metricsTable = document.getElementById('metricsTable');
        metricsTable.innerHTML = '';

        results.forEach(result => {
            const row = metricsTable.insertRow();
            row.innerHTML = `
                <td>${this.getAlgorithmName(result.algorithm)}</td>
                <td>${result.metrics.averageWaitingTime.toFixed(2)}</td>
                <td>${result.metrics.averageTurnaroundTime.toFixed(2)}</td>
                <td>${result.metrics.cpuUtilization.toFixed(2)}%</td>
                <td>${result.metrics.totalEnergyUsed.toFixed(2)}</td>
            `;
        });
    }

    getAlgorithmName(algorithm) {
        const names = {
            'fcfs': 'First Come First Serve (FCFS)',
            'rr': 'Round Robin',
            'energy': 'Energy-Aware Scheduling'
        };
        return names[algorithm] || algorithm;
    }

    updateProcessTable(processes) {
        const processTable = document.getElementById('processTable');
        processTable.innerHTML = '';

        processes.forEach(process => {
            const row = processTable.insertRow();
            row.innerHTML = `
                <td>${process.id}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td>${process.priority}</td>
                <td>
                    <button class="btn-remove" onclick="removeProcess('${process.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </td>
            `;
        });
    }
}