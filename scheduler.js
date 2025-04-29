/**
 * Process class representing a single process in the system
 * @class
 */
class Process {
    /**
     * Create a new process
     * @param {string} id - Unique identifier for the process
     * @param {number} arrivalTime - Time at which process arrives in the system
     * @param {number} burstTime - CPU time required for process execution
     * @param {number} priority - Process priority (higher number = higher priority)
     */
    constructor(id, arrivalTime, burstTime, priority) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime;  // For preemptive algorithms
        this.startTime = null;           // When process first gets CPU
        this.endTime = null;             // When process completes
        this.waitingTime = 0;            // Time spent in ready queue
        this.turnaroundTime = 0;         // Total time from arrival to completion
        this.energyUsed = 0;             // Energy consumed by this process
    }
}

/**
 * Scheduler class implementing various CPU scheduling algorithms
 * @class
 */
class Scheduler {
    constructor() {
        this.processes = [];             // List of all processes
        this.timeline = [];              // Execution timeline for visualization
        this.currentTime = 0;            // Current simulation time
        this.metrics = {                 // Performance metrics
            averageWaitingTime: 0,       // Average time processes spend waiting
            averageTurnaroundTime: 0,    // Average time from arrival to completion
            cpuUtilization: 0,           // Percentage of CPU time used
            totalEnergyUsed: 0           // Total energy consumed
        };
    }

    /**
     * Add a new process to the scheduler
     * @param {Process} process - Process to add
     */
    addProcess(process) {
        this.processes.push(process);
    }

    /**
     * Reset all processes and metrics to initial state
     */
    reset() {
        this.processes.forEach(process => {
            process.remainingTime = process.burstTime;
            process.startTime = null;
            process.endTime = null;
            process.waitingTime = 0;
            process.turnaroundTime = 0;
            process.energyUsed = 0;
        });
        this.timeline = [];
        this.currentTime = 0;
        this.metrics = {
            averageWaitingTime: 0,
            averageTurnaroundTime: 0,
            cpuUtilization: 0,
            totalEnergyUsed: 0
        };
    }

    /**
     * First Come First Serve (FCFS) Scheduling Algorithm
     * Processes are executed in order of arrival
     * Time Complexity: O(n log n) for sorting
     */
    runFCFS() {
        this.reset();
        // Sort processes by arrival time
        const sortedProcesses = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        sortedProcesses.forEach(process => {
            // Handle idle time if no process is available
            if (this.currentTime < process.arrivalTime) {
                this.timeline.push({
                    id: 'idle',
                    start: this.currentTime,
                    end: process.arrivalTime
                });
                this.currentTime = process.arrivalTime;
            }

            // Execute process
            process.startTime = this.currentTime;
            process.waitingTime = this.currentTime - process.arrivalTime;
            this.currentTime += process.burstTime;
            process.endTime = this.currentTime;
            process.turnaroundTime = process.endTime - process.arrivalTime;
            process.energyUsed = process.burstTime * 2; // Base energy consumption

            this.timeline.push({
                id: process.id,
                start: process.startTime,
                end: process.endTime
            });
        });

        this.calculateMetrics();
    }

    /**
     * Round Robin (RR) Scheduling Algorithm
     * Each process gets a fixed time slice (quantum) for execution
     * Time Complexity: O(n * q) where q is the number of time slices
     * @param {number} quantum - Time slice for each process
     */
    runRoundRobin(quantum) {
        this.reset();
        const readyQueue = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        const remainingProcesses = new Map(readyQueue.map(p => [p.id, { ...p }]));

        while (remainingProcesses.size > 0) {
            // Find next process that has arrived
            let currentProcess = null;
            for (let [id, process] of remainingProcesses) {
                if (process.arrivalTime <= this.currentTime) {
                    currentProcess = process;
                    break;
                }
            }

            // Handle idle time if no process is available
            if (!currentProcess) {
                const nextArrival = Math.min(...Array.from(remainingProcesses.values()).map(p => p.arrivalTime));
                this.timeline.push({
                    id: 'idle',
                    start: this.currentTime,
                    end: nextArrival
                });
                this.currentTime = nextArrival;
                continue;
            }

            // Execute process for quantum time or remaining time
            const executeTime = Math.min(quantum, currentProcess.remainingTime);
            
            if (currentProcess.startTime === null) {
                currentProcess.startTime = this.currentTime;
            }

            this.timeline.push({
                id: currentProcess.id,
                start: this.currentTime,
                end: this.currentTime + executeTime
            });

            currentProcess.remainingTime -= executeTime;
            this.currentTime += executeTime;
            
            // Process completed
            if (currentProcess.remainingTime <= 0) {
                currentProcess.endTime = this.currentTime;
                currentProcess.turnaroundTime = currentProcess.endTime - currentProcess.arrivalTime;
                currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                currentProcess.energyUsed = currentProcess.burstTime * 1.5; // RR energy consumption
                remainingProcesses.delete(currentProcess.id);
                
                // Update original process
                const originalProcess = this.processes.find(p => p.id === currentProcess.id);
                Object.assign(originalProcess, currentProcess);
            } else {
                // Move to end of queue
                remainingProcesses.delete(currentProcess.id);
                remainingProcesses.set(currentProcess.id, currentProcess);
            }
        }

        this.calculateMetrics();
    }

    /**
     * Energy-Aware Scheduling Algorithm
     * Optimizes CPU usage to minimize power consumption
     * Uses dynamic speed scaling based on process characteristics
     * Time Complexity: O(n log n) for sorting
     */
    runEnergyAware() {
        this.reset();
        const readyQueue = [...this.processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        
        while (readyQueue.length > 0) {
            // Find shortest remaining time process that has arrived
            const availableProcesses = readyQueue.filter(p => p.arrivalTime <= this.currentTime);
            
            // Handle idle time if no process is available
            if (availableProcesses.length === 0) {
                const nextArrival = Math.min(...readyQueue.map(p => p.arrivalTime));
                this.timeline.push({
                    id: 'idle',
                    start: this.currentTime,
                    end: nextArrival
                });
                this.currentTime = nextArrival;
                continue;
            }

            // Sort by remaining time and burst time (shorter processes first)
            availableProcesses.sort((a, b) => a.remainingTime - b.remainingTime || a.burstTime - b.burstTime);
            const currentProcess = availableProcesses[0];

            if (currentProcess.startTime === null) {
                currentProcess.startTime = this.currentTime;
            }

            // Dynamic speed scaling based on process characteristics
            let speedFactor;
            if (currentProcess.burstTime <= 5) {
                speedFactor = 0.7; // Run at 70% speed for short processes
            } else if (currentProcess.burstTime <= 10) {
                speedFactor = 0.85; // Run at 85% speed for medium processes
            } else {
                speedFactor = 1; // Run at full speed for long processes
            }

            // Calculate execution time with speed factor
            const executionTime = Math.ceil(currentProcess.remainingTime / speedFactor);
            
            this.timeline.push({
                id: currentProcess.id,
                start: this.currentTime,
                end: this.currentTime + executionTime,
                speed: speedFactor
            });

            // Update process metrics
            currentProcess.remainingTime = 0;
            this.currentTime += executionTime;
            currentProcess.endTime = this.currentTime;
            currentProcess.turnaroundTime = currentProcess.endTime - currentProcess.arrivalTime;
            currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
            // Energy consumption is proportional to speed squared (P ∝ V² × f)
            currentProcess.energyUsed = currentProcess.burstTime * speedFactor * speedFactor;

            // Update original process
            const originalProcess = this.processes.find(p => p.id === currentProcess.id);
            Object.assign(originalProcess, currentProcess);

            // Remove from ready queue
            const index = readyQueue.findIndex(p => p.id === currentProcess.id);
            readyQueue.splice(index, 1);
        }

        this.calculateMetrics();
    }

    /**
     * Calculate performance metrics for the scheduling algorithm
     */
    calculateMetrics() {
        const totalProcesses = this.processes.length;
        
        // Calculate average waiting and turnaround times
        this.metrics.averageWaitingTime = this.processes.reduce((sum, p) => sum + p.waitingTime, 0) / totalProcesses;
        this.metrics.averageTurnaroundTime = this.processes.reduce((sum, p) => sum + p.turnaroundTime, 0) / totalProcesses;
        
        // Calculate CPU utilization
        const totalTime = this.currentTime;
        const busyTime = this.timeline.reduce((sum, event) => 
            event.id === 'idle' ? sum : sum + (event.end - event.start), 0);
        this.metrics.cpuUtilization = (busyTime / totalTime) * 100;

        // Calculate total energy consumption
        this.metrics.totalEnergyUsed = this.processes.reduce((sum, p) => sum + p.energyUsed, 0);
    }

    /**
     * Get the results of the scheduling simulation
     * @returns {Object} Results containing timeline, metrics, and process details
     */
    getResults() {
        return {
            timeline: this.timeline,
            metrics: this.metrics,
            processes: this.processes
        };
    }
}