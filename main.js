// Initialize global variables
let scheduler = new Scheduler();
let visualizer = new Visualizer();
let processIdCounter = 1;

// DOM Elements
const processForm = document.getElementById('processForm');
const fcfsCheck = document.getElementById('fcfsCheck');
const rrCheck = document.getElementById('rrCheck');
const energyCheck = document.getElementById('energyCheck');
const quantumContainer = document.getElementById('quantumContainer');
const startSimulationBtn = document.getElementById('startSimulation');
const resetSimulationBtn = document.getElementById('resetSimulation');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('processId').value = `P${processIdCounter}`;
    updateQuantumVisibility();
});

[fcfsCheck, rrCheck, energyCheck].forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        updateQuantumVisibility();
        validateAlgorithmSelection();
    });
});

processForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addProcess();
});

startSimulationBtn.addEventListener('click', runSimulation);
resetSimulationBtn.addEventListener('click', resetSimulation);

// Functions
function updateQuantumVisibility() {
    quantumContainer.style.display = 
        rrCheck.checked ? 'block' : 'none';
}

function validateAlgorithmSelection() {
    const selectedCount = [fcfsCheck, rrCheck, energyCheck]
        .filter(checkbox => checkbox.checked).length;
    
    if (selectedCount > 3) {
        alert('Please select at most 3 algorithms.');
        return false;
    }
    if (selectedCount === 0) {
        alert('Please select at least 1 algorithm.');
        return false;
    }
    return true;
}

function addProcess() {
    const arrivalTime = parseInt(document.getElementById('arrivalTime').value);
    const burstTime = parseInt(document.getElementById('burstTime').value);
    const priority = parseInt(document.getElementById('priority').value);
    const processId = `P${processIdCounter}`;

    const process = new Process(processId, arrivalTime, burstTime, priority);
    scheduler.addProcess(process);
    
    // Update UI
    visualizer.updateProcessTable(scheduler.processes);
    
    // Reset form
    processForm.reset();
    processIdCounter++;
    document.getElementById('processId').value = `P${processIdCounter}`;
}

function removeProcess(processId) {
    scheduler.processes = scheduler.processes.filter(p => p.id !== processId);
    visualizer.updateProcessTable(scheduler.processes);
}

function runSimulation() {
    if (scheduler.processes.length === 0) {
        alert('Please add at least one process before starting the simulation.');
        return;
    }

    if (!validateAlgorithmSelection()) {
        return;
    }

    const selectedAlgorithms = [];
    if (fcfsCheck.checked) selectedAlgorithms.push('fcfs');
    if (rrCheck.checked) selectedAlgorithms.push('rr');
    if (energyCheck.checked) selectedAlgorithms.push('energy');

    const results = [];
    const quantum = parseInt(document.getElementById('timeQuantum').value);

    selectedAlgorithms.forEach(algorithm => {
        const algorithmScheduler = new Scheduler();
        algorithmScheduler.processes = [...scheduler.processes];
        
        switch (algorithm) {
            case 'fcfs':
                algorithmScheduler.runFCFS();
                break;
            case 'rr':
                algorithmScheduler.runRoundRobin(quantum);
                break;
            case 'energy':
                algorithmScheduler.runEnergyAware();
                break;
        }

        const algorithmResults = algorithmScheduler.getResults();
        results.push({
            algorithm,
            timeline: algorithmResults.timeline,
            metrics: algorithmResults.metrics
        });
    });
    
    // Update visualizations
    visualizer.drawGanttCharts(results);
    visualizer.drawEnergyComparisonChart(results);
    visualizer.updateMetricsTable(results);
}

function resetSimulation() {
    scheduler = new Scheduler();
    processIdCounter = 1;
    document.getElementById('processId').value = `P${processIdCounter}`;
    
    // Clear all visualizations
    document.getElementById('ganttChartsContainer').innerHTML = '';
    document.getElementById('processTable').innerHTML = '';
    document.getElementById('metricsTable').innerHTML = '';
    
    if (visualizer.energyChart) {
        visualizer.energyChart.destroy();
    }
    
    // Reset checkboxes
    fcfsCheck.checked = false;
    rrCheck.checked = false;
    energyCheck.checked = false;
    
    // Reset form
    processForm.reset();
}