/**
 * SMART CRADLE AI — FRONTEND PROTOTYPE ARCHITECTURE & INTERACTIVE CONTROLLER
 * SIH Hackathon Prototype
 * 
 * Functions exposed for modularity & future ESP32 / REST API integration:
 * - updateSensorData()
 * - analyzeCry()
 * - controlCradle()
 * - sendParentAlert()
 * - updateDashboard()
 * - startDemoMode()
 */

// Global Application State
const state = {
    theme: 'dark',
    activePage: 'landing',
    isListening: true,
    isAnalyzing: false,
    
    // Baby & Sensor Data State
    baby: {
        status: 'CALM', // CALM, CRYING, NEEDS_ATTENTION
        cryIntensity: 14, // 0-100%
        detectedPattern: 'SLEEPY',
        confidence: 87,
        probabilities: { Hungry: 12, Sleepy: 67, Discomfort: 16, Abnormal: 5 }
    },
    
    sensors: {
        temp: 28.4,
        humidity: 62,
        movement: 'NORMAL',
        accelVal: 0.12,
        vibration: 'Normal',
        voltage: 5.10
    },

    cradle: {
        motorState: true,
        mode: 'AUTO', // AUTO, MANUAL
        speed: 35, // 0-100%
        motionPattern: 'Gentle Sway',
        lullabyPlaying: true,
        soothingMode: true
    },

    alerts: [],
    demoStep: 0,
    demoTimer: null,
    audioSynth: null
};

// Chart.js References
let charts = {};
let liveWaveformAnimationId = null;
let fullWaveformAnimationId = null;

// Initialization when DOM Content is Ready
document.addEventListener('DOMContentLoaded', () => {
    initRealtimeClock();
    initWaveformCanvas();
    initCharts();
    initSensorLoop();
    initAudioSynth();
    updateDashboardUI();
    updateCradleUI();
});

/* ================= PAGE ROUTING / NAVIGATION ================= */
function navigateTo(pageId) {
    state.activePage = pageId;

    // Update Nav Buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        if (btn.getAttribute('data-target') === pageId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Update Page Views
    document.querySelectorAll('.page-view').forEach(view => {
        if (view.id === pageId) {
            view.classList.add('active');
        } else {
            view.classList.remove('active');
        }
    });

    // Resize Chart.js instances if navigating to charts view
    if (pageId === 'sensors' || pageId === 'analysis' || pageId === 'analytics') {
        setTimeout(() => {
            Object.values(charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') chart.resize();
            });
        }, 150);
    }
}

/* ================= REAL-TIME CLOCK ================= */
function initRealtimeClock() {
    const clockEl = document.getElementById('realtimeClock');
    const updateClock = () => {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
    };
    updateClock();
    setInterval(updateClock, 1000);
}

/* ================= THEME TOGGLE ================= */
function toggleTheme() {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    state.theme = newTheme;

    const btnIcon = document.querySelector('#themeToggleBtn i');
    if (btnIcon) {
        btnIcon.className = newTheme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
    }

    showToast(`Switched to ${newTheme.toUpperCase()} theme`, 'info');
}

/* ================= WEB AUDIO API SYNTHESIZER (LULLABY & SOUNDS) ================= */
function initAudioSynth() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioContext = new AudioContext();
    } catch (e) {
        console.warn('Web Audio API not fully supported on this browser.');
    }
}

function playTone(freq, type = 'sine', duration = 0.5) {
    if (!state.audioContext) return;
    try {
        if (state.audioContext.state === 'suspended') {
            state.audioContext.resume();
        }
        const osc = state.audioContext.createOscillator();
        const gain = state.audioContext.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, state.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, state.audioContext.currentTime + duration);
        osc.connect(gain);
        gain.connect(state.audioContext.destination);
        osc.start();
        osc.stop(state.audioContext.currentTime + duration);
    } catch (e) {}
}

function playLullabyMelody() {
    if (!state.cradle.lullabyPlaying) return;
    const notes = [329.63, 392.00, 440.00, 392.00, 329.63, 293.66]; // E4, G4, A4, G4, E4, D4
    const note = notes[Math.floor(Math.random() * notes.length)];
    playTone(note, 'sine', 1.2);
}

/* ================= SIMULATED LIVE SENSOR DATA LOOP ================= */
function initSensorLoop() {
    setInterval(() => {
        updateSensorData();
    }, 2500);
}

function updateSensorData() {
    // Slight realistic fluctuation
    state.sensors.temp = parseFloat((28.0 + (Math.random() * 0.8 - 0.4)).toFixed(1));
    state.sensors.humidity = Math.min(80, Math.max(40, Math.round(62 + (Math.random() * 4 - 2))));
    state.sensors.voltage = parseFloat((5.05 + Math.random() * 0.1).toFixed(2));

    if (state.baby.status === 'CALM') {
        state.baby.cryIntensity = Math.max(5, Math.min(25, Math.round(14 + (Math.random() * 8 - 4))));
        state.sensors.accelVal = parseFloat((0.08 + Math.random() * 0.05).toFixed(2));
    } else if (state.baby.status === 'CRYING') {
        state.baby.cryIntensity = Math.min(98, Math.max(60, Math.round(state.baby.cryIntensity + (Math.random() * 10 - 5))));
        state.sensors.accelVal = parseFloat((0.25 + Math.random() * 0.15).toFixed(2));
    }

    updateDashboardUI();
    updateSensorsPageUI();

    // Push new data point to live charts if initialized
    if (charts.tempSensorChart) {
        const timeLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        pushChartData(charts.tempSensorChart, timeLabel, state.sensors.temp);
        pushChartData(charts.humiditySensorChart, timeLabel, state.sensors.humidity);
        pushChartData(charts.cryIntensityChart, timeLabel, state.baby.cryIntensity);
        pushChartData(charts.movementSensorChart, timeLabel, state.sensors.accelVal);
    }

    if (state.cradle.lullabyPlaying && state.cradle.motorState) {
        playLullabyMelody();
    }
}

function pushChartData(chart, label, value) {
    if (!chart) return;
    chart.data.labels.push(label);
    chart.data.datasets[0].data.push(value);
    if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.update('none');
}

/* ================= DASHBOARD UI UPDATE ================= */
function updateDashboardUI() {
    // 1. Baby Status Card
    const statusText = document.getElementById('babyStatusText');
    const statusBadge = document.getElementById('babyStatusBadge');
    const statusRing = document.getElementById('babyStatusRing');
    const statusIcon = document.getElementById('babyStatusIcon');

    if (statusText) {
        if (state.baby.status === 'CALM') {
            statusText.textContent = 'Baby is Calm';
            statusBadge.className = 'badge badge-success';
            statusBadge.textContent = 'CALM';
            statusRing.className = 'status-ring pulse-green';
            statusIcon.className = 'fa-solid fa-face-smile';
        } else if (state.baby.status === 'CRYING') {
            statusText.textContent = 'Cry Detected!';
            statusBadge.className = 'badge badge-warning';
            statusBadge.textContent = 'CRYING';
            statusRing.className = 'status-ring pulse-red';
            statusIcon.className = 'fa-solid fa-face-sad-cry';
        } else if (state.baby.status === 'NEEDS_ATTENTION') {
            statusText.textContent = 'Attention Required!';
            statusBadge.className = 'badge badge-danger';
            statusBadge.textContent = 'ALERT';
            statusRing.className = 'status-ring pulse-red';
            statusIcon.className = 'fa-solid fa-triangle-exclamation';
        }
    }

    // 2. Cry Intensity Card
    const cryValEl = document.getElementById('cryIntensityVal');
    const cryBarEl = document.getElementById('cryIntensityBar');
    if (cryValEl) cryValEl.textContent = `${state.baby.cryIntensity}%`;
    if (cryBarEl) cryBarEl.style.width = `${state.baby.cryIntensity}%`;

    // 3. AI Analysis Card
    const confidenceVal = document.getElementById('aiConfidenceVal');
    const detectedCat = document.getElementById('aiDetectedCategory');
    const ring = document.getElementById('confidenceRing');

    if (confidenceVal) confidenceVal.textContent = `${state.baby.confidence}%`;
    if (detectedCat) detectedCat.textContent = state.baby.detectedPattern;
    if (ring) {
        // Circumference = 264. Offset = 264 - (264 * confidence / 100)
        const offset = 264 - (264 * state.baby.confidence / 100);
        ring.style.strokeDashoffset = offset;
    }

    // 4. Environment Card
    const dTemp = document.getElementById('dashTemp');
    const dHum = document.getElementById('dashHumidity');
    const dVolt = document.getElementById('dashVoltage');
    if (dTemp) dTemp.textContent = `${state.sensors.temp}°C`;
    if (dHum) dHum.textContent = `${state.sensors.humidity}%`;
    if (dVolt) dVolt.textContent = `${state.sensors.voltage} V`;
}

function updateSensorsPageUI() {
    const sTemp = document.getElementById('sensTemp');
    const sHum = document.getElementById('sensHumidity');
    const sMov = document.getElementById('sensMovement');
    const sCry = document.getElementById('sensCryIntensity');
    const sVolt = document.getElementById('sensVoltage');

    if (sTemp) sTemp.textContent = `${state.sensors.temp} °C`;
    if (sHum) sHum.textContent = `${state.sensors.humidity} %`;
    if (sMov) sMov.textContent = `${state.sensors.accelVal} g`;
    if (sCry) sCry.textContent = `${state.baby.cryIntensity} %`;
    if (sVolt) sVolt.textContent = `${state.sensors.voltage} V`;
}

/* ================= AUDIO WAVEFORM CANVASES ================= */
function initWaveformCanvas() {
    const liveCanvas = document.getElementById('liveWaveformCanvas');
    const fullCanvas = document.getElementById('fullAudioWaveformCanvas');

    let step = 0;
    const drawWaveform = () => {
        step += 0.08;
        
        // Draw Mini Live Canvas
        if (liveCanvas && liveCanvas.getContext) {
            const ctx = liveCanvas.getContext('2d');
            const w = liveCanvas.width;
            const h = liveCanvas.height;
            ctx.clearRect(0, 0, w, h);

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#06B6D4';

            const amp = (state.baby.cryIntensity / 100) * (h / 2.5);
            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin(x * 0.05 + step) * amp * Math.cos(x * 0.02);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        // Draw Full Analysis Canvas
        if (fullCanvas && fullCanvas.getContext) {
            const ctx = fullCanvas.getContext('2d');
            const w = fullCanvas.width;
            const h = fullCanvas.height;
            ctx.clearRect(0, 0, w, h);

            // Grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.lineWidth = 1;
            for (let i = 0; i < w; i += 40) {
                ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke();
            }
            for (let j = 0; j < h; j += 30) {
                ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke();
            }

            // Waveform stream
            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#38BDF8';
            const amp = (state.baby.cryIntensity / 100) * (h / 2.2);

            for (let x = 0; x < w; x++) {
                const y = h / 2 + Math.sin(x * 0.03 + step * 1.5) * amp * Math.sin(x * 0.01) + (Math.random() * 3 - 1.5);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
        }

        requestAnimationFrame(drawWaveform);
    };

    drawWaveform();
}

function startAudioListening() {
    state.isListening = true;
    document.getElementById('startListenBtn').disabled = true;
    document.getElementById('stopListenBtn').disabled = false;
    document.getElementById('listenStateBadge').innerHTML = `<i class="fa-solid fa-circle-dot"></i> Live Listening Active`;
    showToast('Microphone INMP441 audio stream active', 'info');
}

function stopAudioListening() {
    state.isListening = false;
    document.getElementById('startListenBtn').disabled = false;
    document.getElementById('stopListenBtn').disabled = true;
    document.getElementById('listenStateBadge').innerHTML = `<i class="fa-solid fa-circle-pause"></i> Listening Paused`;
    showToast('Audio stream paused', 'warning');
}

/* ================= AI CRY ANALYSIS PIPELINE RUNNER ================= */
function triggerManualAnalysis() {
    if (state.isAnalyzing) return;
    analyzeCry();
}

function analyzeCry(targetCategory = null) {
    state.isAnalyzing = true;
    const steps = ['step1', 'step2', 'step3', 'step4', 'step5'];
    
    // Reset pipeline step UI
    steps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-step');
    });

    let currentStepIndex = 0;
    showToast('AI Cry Pattern Feature Extraction Started...', 'info');

    const runStep = () => {
        if (currentStepIndex < steps.length) {
            const stepId = steps[currentStepIndex];
            const el = document.getElementById(stepId);
            if (el) el.classList.add('active-step');
            playTone(400 + currentStepIndex * 150, 'triangle', 0.2);
            currentStepIndex++;
            setTimeout(runStep, 600);
        } else {
            // Finished Analysis
            state.isAnalyzing = false;
            
            // Set Result Category & Probabilities
            const chosenCategory = targetCategory || getRandomCategory();
            state.baby.detectedPattern = chosenCategory.name;
            state.baby.confidence = chosenCategory.confidence;
            state.baby.probabilities = chosenCategory.probs;
            state.baby.status = chosenCategory.name === 'Abnormal Cry Pattern' ? 'NEEDS_ATTENTION' : 'CRYING';
            state.baby.cryIntensity = chosenCategory.intensity;

            // Update Analysis Results UI
            const resPattern = document.getElementById('analysisResultPattern');
            const resConf = document.getElementById('analysisResultConfidence');
            const resRec = document.getElementById('analysisRecommendation');

            if (resPattern) resPattern.textContent = chosenCategory.name.toUpperCase();
            if (resConf) resConf.textContent = `${chosenCategory.confidence}%`;
            if (resRec) resRec.textContent = chosenCategory.recommendation;

            // Update Probability Chart
            if (charts.probabilityChart) {
                charts.probabilityChart.data.datasets[0].data = [
                    chosenCategory.probs.Hungry,
                    chosenCategory.probs.Sleepy,
                    chosenCategory.probs.Discomfort,
                    chosenCategory.probs.Abnormal
                ];
                charts.probabilityChart.update();
            }

            // Trigger Automatic Cradle Action if in AUTO mode
            if (state.cradle.mode === 'AUTO') {
                controlCradle(chosenCategory.autoAction.motor, chosenCategory.autoAction.speed, chosenCategory.autoAction.lullaby);
            }

            // Send Notification Alert
            sendParentAlert(
                chosenCategory.name === 'Abnormal Cry Pattern' ? 'warning' : 'cry',
                `AI Classification: ${chosenCategory.name} (${chosenCategory.confidence}% Probable Confidence)`,
                chosenCategory.alertMsg
            );

            updateDashboardUI();
            playTone(880, 'sine', 0.4);
            showToast(`Analysis Complete: ${chosenCategory.name} detected!`, 'success');
        }
    };

    runStep();
}

function getRandomCategory() {
    const list = [
        {
            name: 'SLEEPY',
            confidence: 87,
            intensity: 78,
            probs: { Hungry: 12, Sleepy: 67, Discomfort: 16, Abnormal: 5 },
            recommendation: 'Gentle cradle rocking (35% speed) and soft lullaby audio recommended.',
            alertMsg: 'Baby cry pattern analyzed as Sleepy with 87% probable confidence.',
            autoAction: { motor: true, speed: 35, lullaby: true }
        },
        {
            name: 'HUNGRY',
            confidence: 91,
            intensity: 84,
            probs: { Hungry: 78, Sleepy: 10, Discomfort: 8, Abnormal: 4 },
            recommendation: 'Feeding notification sent. Moderate cradle motion activated to calm baby.',
            alertMsg: 'Rhythmic hunger cry pattern detected. Parent feeding suggested.',
            autoAction: { motor: true, speed: 40, lullaby: true }
        },
        {
            name: 'DISCOMFORT',
            confidence: 83,
            intensity: 72,
            probs: { Hungry: 15, Sleepy: 12, Discomfort: 68, Abnormal: 5 },
            recommendation: 'Check diaper / nursery environment. Mild cradle sway active.',
            alertMsg: 'Discomfort cry pattern identified. Check ambient temperature or diaper status.',
            autoAction: { motor: true, speed: 30, lullaby: true }
        },
        {
            name: 'ABNORMAL CRY PATTERN',
            confidence: 94,
            intensity: 95,
            probs: { Hungry: 6, Sleepy: 4, Discomfort: 12, Abnormal: 78 },
            recommendation: 'Immediate parent check required. Unusual acoustic pitch detected!',
            alertMsg: 'HIGH PRIORITY: High pitch abnormal cry pattern detected. Immediate attention requested.',
            autoAction: { motor: false, speed: 0, lullaby: false }
        }
    ];

    return list[Math.floor(Math.random() * list.length)];
}

function triggerSimulatedCry(type) {
    if (type === 'Sleepy') {
        analyzeCry('SLEEPY');
    } else if (type === 'Hungry') {
        analyzeCry('HUNGRY');
    } else if (type === 'Abnormal') {
        analyzeCry('ABNORMAL CRY PATTERN');
    }
}

/* ================= CRADLE CONTROLLER ================= */
function controlCradle(motorOn = null, speedVal = null, lullabyOn = null) {
    if (motorOn !== null) state.cradle.motorState = motorOn;
    if (speedVal !== null) state.cradle.speed = speedVal;
    if (lullabyOn !== null) state.cradle.lullabyPlaying = lullabyOn;

    updateCradleUI();
}

function setCradleMode(mode) {
    state.cradle.mode = mode;
    const btnAuto = document.getElementById('btnAutoMode');
    const btnMan = document.getElementById('btnManualMode');

    if (mode === 'AUTO') {
        btnAuto.classList.add('active');
        btnMan.classList.remove('active');
        document.getElementById('cradleModeBadge').textContent = 'AUTO MODE';
        showToast('Smart Cradle set to Automatic AI Rule Mode', 'info');
    } else {
        btnMan.classList.add('active');
        btnAuto.classList.remove('active');
        document.getElementById('cradleModeBadge').textContent = 'MANUAL OVERRIDE';
        showToast('Smart Cradle set to Manual Control', 'warning');
    }
    updateCradleUI();
}

function toggleCradleMotor() {
    state.cradle.motorState = !state.cradle.motorState;
    if (state.cradle.motorState && state.cradle.speed === 0) {
        state.cradle.speed = 35;
    }
    updateCradleUI();
    showToast(`Cradle Motor turned ${state.cradle.motorState ? 'ON' : 'OFF'}`, state.cradle.motorState ? 'success' : 'warning');
}

function setCradleSpeed(preset, val) {
    state.cradle.speed = val;
    state.cradle.motorState = val > 0;

    document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
    if (preset === 'slow') document.getElementById('speedSlow').classList.add('active');
    if (preset === 'medium') document.getElementById('speedMedium').classList.add('active');
    if (preset === 'fast') document.getElementById('speedFast').classList.add('active');

    const slider = document.getElementById('cradleSpeedSlider');
    if (slider) slider.value = val;

    updateCradleUI();
}

function onSpeedSliderChange(val) {
    state.cradle.speed = parseInt(val);
    state.cradle.motorState = parseInt(val) > 0;
    updateCradleUI();
}

function toggleLullabyAudio(checked) {
    state.cradle.lullabyPlaying = checked;
    updateCradleUI();
    showToast(`Lullaby Audio ${checked ? 'Enabled' : 'Muted'}`, 'info');
}

function toggleSoothingMode(checked) {
    state.cradle.soothingMode = checked;
    showToast(`Dynamic Soothing Mode ${checked ? 'Active' : 'Disabled'}`, 'info');
}

function updateCradleUI() {
    const motorStateEl = document.getElementById('cradleMotorState');
    const speedValEl = document.getElementById('cradleSpeedVal');
    const lullabyStateEl = document.getElementById('cradleLullabyState');

    const lblMotor = document.getElementById('lblMotorStatus');
    const lblMode = document.getElementById('lblModeStatus');
    const lblSpeed = document.getElementById('lblSpeedStatus');
    const lblMotion = document.getElementById('lblMotionStatus');
    const sliderVal = document.getElementById('sliderSpeedVal');

    const btnPower = document.getElementById('btnMainMotorPower');
    const btnPowerText = document.getElementById('btnMotorPowerText');
    const miniCradleAnim = document.getElementById('miniCradleAnim');
    const mainMotionWrapper = document.getElementById('cradleMotionWrapper');

    if (motorStateEl) motorStateEl.textContent = state.cradle.motorState ? 'ON' : 'OFF';
    if (speedValEl) speedValEl.textContent = `${state.cradle.speed}%`;
    if (lullabyStateEl) lullabyStateEl.textContent = state.cradle.lullabyPlaying ? 'PLAYING' : 'MUTED';

    if (lblMotor) lblMotor.textContent = state.cradle.motorState ? 'MOTOR RUNNING' : 'STOPPED';
    if (lblMode) lblMode.textContent = state.cradle.mode;
    if (lblSpeed) lblSpeed.textContent = `${state.cradle.speed}%`;
    if (sliderVal) sliderVal.textContent = `${state.cradle.speed}%`;

    // Motion pattern text
    let motionText = 'Stopped';
    if (state.cradle.motorState) {
        if (state.cradle.speed <= 25) motionText = 'Slow Sway';
        else if (state.cradle.speed <= 50) motionText = 'Gentle Sway';
        else motionText = 'Fast Rocking';
    }
    if (lblMotion) lblMotion.textContent = motionText;

    // Button states
    if (btnPower && btnPowerText) {
        if (state.cradle.motorState) {
            btnPower.className = 'btn btn-power';
            btnPowerText.textContent = 'STOP CRADLE';
        } else {
            btnPower.className = 'btn btn-power is-off';
            btnPowerText.textContent = 'START CRADLE';
        }
    }

    // SVG & Icon Animations
    if (miniCradleAnim) {
        if (state.cradle.motorState) miniCradleAnim.classList.add('rocking');
        else miniCradleAnim.classList.remove('rocking');
    }

    if (mainMotionWrapper) {
        mainMotionWrapper.classList.remove('cradle-rocking-active', 'cradle-rocking-fast');
        if (state.cradle.motorState) {
            if (state.cradle.speed > 50) mainMotionWrapper.classList.add('cradle-rocking-fast');
            else mainMotionWrapper.classList.add('cradle-rocking-active');
        }
    }
}

/* ================= PARENT ALERTS & TOASTS ================= */
function sendParentAlert(severity, title, message) {
    const alertItem = {
        id: Date.now(),
        severity: severity, // warning, cry, system
        title: title,
        message: message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
    };

    state.alerts.unshift(alertItem);
    renderAlerts();
    updateNavAlertBadge();
    showToast(title, severity === 'warning' ? 'warning' : 'info');
}

function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    if (state.alerts.length === 0) {
        container.innerHTML = `
            <div class="glass-card text-center p-4">
                <i class="fa-solid fa-bell-slash text-muted" style="font-size: 2.5rem; margin-bottom: 0.5rem;"></i>
                <p>No active alerts at this time.</p>
            </div>
        `;
        return;
    }

    let html = '';
    state.alerts.forEach(item => {
        let icon = 'fa-bell';
        let severityTag = '<span class="severity-tag tag-info">INFO</span>';
        let classSev = 'severity-info';

        if (item.severity === 'warning') {
            icon = 'fa-triangle-exclamation';
            severityTag = '<span class="severity-tag tag-high">HIGH SEVERITY</span>';
            classSev = 'severity-warning';
        } else if (item.severity === 'cry') {
            icon = 'fa-baby';
            severityTag = '<span class="severity-tag tag-warning">CRY EVENT</span>';
            classSev = 'severity-info';
        } else if (item.severity === 'system') {
            icon = 'fa-shield-halved';
            severityTag = '<span class="severity-tag tag-success">SYSTEM</span>';
            classSev = 'severity-system';
        }

        html += `
            <div class="alert-card glass-card ${item.read ? '' : 'unread'} ${classSev}" data-type="${item.severity}">
                <div class="alert-icon-box">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-top">
                        <h4 class="alert-title">${item.title}</h4>
                        <span class="alert-time">${item.time}</span>
                    </div>
                    <p class="alert-msg">${item.message}</p>
                    <div class="alert-footer">
                        ${severityTag}
                        <button class="btn-link" onclick="dismissAlertById(${item.id})">${item.read ? 'Dismiss' : 'Mark as Read'}</button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function dismissAlertById(id) {
    const alertObj = state.alerts.find(a => a.id === id);
    if (alertObj) alertObj.read = true;
    renderAlerts();
    updateNavAlertBadge();
}

function dismissAlert(btnEl) {
    const card = btnEl.closest('.alert-card');
    if (card) {
        card.classList.remove('unread');
        updateNavAlertBadge();
    }
}

function markAllAlertsRead() {
    state.alerts.forEach(a => a.read = true);
    renderAlerts();
    updateNavAlertBadge();
    showToast('All notifications marked as read', 'success');
}

function clearAllAlerts() {
    state.alerts = [];
    renderAlerts();
    updateNavAlertBadge();
    showToast('Notification center cleared', 'info');
}

function updateNavAlertBadge() {
    const unreadCount = state.alerts.filter(a => !a.read).length;
    const badge = document.getElementById('navAlertCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

function filterAlerts(type) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');

    document.querySelectorAll('.alert-card').forEach(card => {
        if (type === 'all' || card.getAttribute('data-type') === type) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    
    let iconClass = 'fa-circle-info text-cyan';
    if (type === 'success') iconClass = 'fa-circle-check text-success';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation text-warning';
    if (type === 'danger') iconClass = 'fa-circle-xmark text-danger';

    toast.innerHTML = `
        <i class="fa-solid ${iconClass} toast-icon"></i>
        <span class="toast-msg">${msg}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

/* ================= AUTOMATED DEMO MODE ================= */
const demoSteps = [
    {
        num: 'STEP 1 OF 8',
        title: 'System: Listening for baby cry...',
        desc: 'Microphone INMP441 capturing live audio feed in the nursery environment.',
        action: () => {
            navigateTo('dashboard');
            state.baby.status = 'CALM';
            state.baby.cryIntensity = 12;
            updateDashboardUI();
        }
    },
    {
        num: 'STEP 2 OF 8',
        title: 'Cry detected!',
        desc: 'Audio threshold breached (Intensity: 87%). System switches state to CRYING.',
        action: () => {
            state.baby.status = 'CRYING';
            state.baby.cryIntensity = 87;
            updateDashboardUI();
        }
    },
    {
        num: 'STEP 3 OF 8',
        title: 'Processing audio stream...',
        desc: 'Executing FFT Spectrogram filter & noise cancellation on sample window.',
        action: () => {
            navigateTo('analysis');
            const el = document.getElementById('step2');
            if (el) el.classList.add('active-step');
        }
    },
    {
        num: 'STEP 4 OF 8',
        title: 'AI analyzing cry pattern...',
        desc: 'Deep learning CNN model extracting pitch dynamics and acoustic MFCC features.',
        action: () => {
            const el1 = document.getElementById('step3');
            const el2 = document.getElementById('step4');
            if (el1) el1.classList.add('active-step');
            if (el2) el2.classList.add('active-step');
        }
    },
    {
        num: 'STEP 5 OF 8',
        title: 'AI Classification Output',
        desc: 'Probable Pattern: SLEEPY | Confidence Rating: 87%',
        action: () => {
            const el = document.getElementById('step5');
            if (el) el.classList.add('active-step');
            state.baby.detectedPattern = 'SLEEPY';
            state.baby.confidence = 87;
            
            const resPattern = document.getElementById('analysisResultPattern');
            const resConf = document.getElementById('analysisResultConfidence');
            if (resPattern) resPattern.textContent = 'SLEEPY';
            if (resConf) resConf.textContent = '87%';
        }
    },
    {
        num: 'STEP 6 OF 8',
        title: 'Automatic Cradle Actuation',
        desc: 'Decision Engine triggers Motor -> ON (35% Gentle Sway) & Lullaby Audio -> ON',
        action: () => {
            navigateTo('cradle');
            controlCradle(true, 35, true);
        }
    },
    {
        num: 'STEP 7 OF 8',
        title: 'Dashboard updates status',
        desc: 'Live dashboard syncs automatically & Parent notification sent.',
        action: () => {
            sendParentAlert('cry', 'Automated Soothing Initiated', 'Cradle started gentle sway mode for detected Sleepy cry.');
            navigateTo('dashboard');
        }
    },
    {
        num: 'STEP 8 OF 8',
        title: 'Parent Alert Logged',
        desc: 'Baby status logged as Calming Down. Demo sequence successfully completed!',
        action: () => {
            navigateTo('alerts');
            showToast('Demo Sequence Finished! Smart Cradle AI in active mode.', 'success');
        }
    }
];

function startDemoMode() {
    state.demoStep = 0;
    const modal = document.getElementById('demoModalBackdrop');
    if (modal) modal.classList.add('active');
    runDemoStep(0);
}

function stopDemoMode() {
    const modal = document.getElementById('demoModalBackdrop');
    if (modal) modal.classList.remove('active');
    if (state.demoTimer) clearTimeout(state.demoTimer);
    showToast('Demo mode exited', 'info');
}

function runDemoStep(stepIdx) {
    if (stepIdx >= demoSteps.length) {
        stopDemoMode();
        return;
    }

    state.demoStep = stepIdx;
    const stepObj = demoSteps[stepIdx];

    document.getElementById('demoStepNum').textContent = stepObj.num;
    document.getElementById('demoStepTitle').textContent = stepObj.title;
    document.getElementById('demoStepDesc').textContent = stepObj.desc;
    document.getElementById('demoProgressFill').style.width = `${((stepIdx + 1) / demoSteps.length) * 100}%`;

    // Run step action
    stepObj.action();

    // Auto progress after 3.5 seconds
    if (state.demoTimer) clearTimeout(state.demoTimer);
    state.demoTimer = setTimeout(() => {
        if (document.getElementById('demoModalBackdrop').classList.contains('active')) {
            nextDemoStep();
        }
    }, 3800);
}

function nextDemoStep() {
    if (state.demoStep + 1 < demoSteps.length) {
        runDemoStep(state.demoStep + 1);
    } else {
        stopDemoMode();
    }
}

/* ================= CHART.JS INITIALIZATION ================= */
function initCharts() {
    Chart.defaults.color = '#94A3B8';
    Chart.defaults.font.family = 'Plus Jakarta Sans, sans-serif';

    // 1. AI Analysis Probability Chart
    const ctxProb = document.getElementById('probabilityChart');
    if (ctxProb) {
        charts.probabilityChart = new Chart(ctxProb, {
            type: 'bar',
            data: {
                labels: ['Hungry', 'Sleepy', 'Discomfort', 'Abnormal'],
                datasets: [{
                    label: 'Probability (%)',
                    data: [12, 67, 16, 5],
                    backgroundColor: ['#06B6D4', '#38BDF8', '#6366F1', '#EF4444'],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 2. Sensor Live Charts (Temp, Humidity, Cry Intensity, Movement)
    const createLineChart = (id, label, color, initialVal) => {
        const ctx = document.getElementById(id);
        if (!ctx) return null;
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['10:00', '10:01', '10:02', '10:03', '10:04'],
                datasets: [{
                    label: label,
                    data: [initialVal - 0.2, initialVal + 0.1, initialVal - 0.1, initialVal, initialVal + 0.2],
                    borderColor: color,
                    backgroundColor: color + '22',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    };

    charts.tempSensorChart = createLineChart('tempSensorChart', 'Temperature (°C)', '#F59E0B', 28.4);
    charts.humiditySensorChart = createLineChart('humiditySensorChart', 'Humidity (%)', '#06B6D4', 62);
    charts.cryIntensityChart = createLineChart('cryIntensityChart', 'Cry Intensity (%)', '#EF4444', 14);
    charts.movementSensorChart = createLineChart('movementSensorChart', 'Movement (g)', '#38BDF8', 0.12);

    // 3. Analytics Charts
    const ctxHour = document.getElementById('cryEventsByHourChart');
    if (ctxHour) {
        charts.cryEventsByHourChart = new Chart(ctxHour, {
            type: 'bar',
            data: {
                labels: ['12 AM', '3 AM', '6 AM', '9 AM', '12 PM', '3 PM', '6 PM', '9 PM'],
                datasets: [{
                    label: 'Cry Events',
                    data: [1, 4, 3, 2, 1, 2, 3, 2],
                    backgroundColor: '#38BDF8',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    const ctxPie = document.getElementById('cryDistributionPieChart');
    if (ctxPie) {
        charts.cryDistributionPieChart = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Sleepy', 'Hungry', 'Discomfort', 'Abnormal'],
                datasets: [{
                    data: [65, 20, 10, 5],
                    backgroundColor: ['#38BDF8', '#06B6D4', '#6366F1', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    const ctxTrend = document.getElementById('tempTrendChart');
    if (ctxTrend) {
        charts.tempTrendChart = new Chart(ctxTrend, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
                datasets: [{
                    label: 'Room Temp (°C)',
                    data: [25.5, 25.2, 26.8, 28.4, 27.9, 26.5],
                    borderColor: '#F59E0B',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    const ctxTimeline = document.getElementById('cradleTimelineChart');
    if (ctxTimeline) {
        charts.cradleTimelineChart = new Chart(ctxTimeline, {
            type: 'bar',
            data: {
                labels: ['02:00', '04:30', '06:15', '09:10', '11:45'],
                datasets: [{
                    label: 'Cradle Speed (%)',
                    data: [35, 60, 20, 35, 40],
                    backgroundColor: '#10B981',
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

function setAnalyticsDateFilter(range) {
    document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');

    if (charts.cryEventsByHourChart) {
        if (range === 'today') {
            charts.cryEventsByHourChart.data.datasets[0].data = [1, 4, 3, 2, 1, 2, 3, 2];
        } else if (range === '7days') {
            charts.cryEventsByHourChart.data.datasets[0].data = [12, 18, 14, 22, 15, 19, 24, 16];
        } else {
            charts.cryEventsByHourChart.data.datasets[0].data = [45, 62, 58, 70, 52, 68, 74, 60];
        }
        charts.cryEventsByHourChart.update();
    }
    showToast(`Analytics filtered for ${range.toUpperCase()}`, 'info');
}

/* ================= SYSTEM ARCHITECTURE INTERACTIVE DETAILS ================= */
function showNodeDetails(nodeType) {
    const titleEl = document.getElementById('archDetailTitle');
    const bodyEl = document.getElementById('archDetailBody');

    const detailsMap = {
        baby: {
            title: 'Baby Acoustic & Physical Movement Source',
            body: 'Generates acoustic pressure waves (baby cry sound) and physical movement forces within the cradle basket.'
        },
        sensors: {
            title: 'IoT Telemetry Sensors',
            body: 'INMP441 I2S MEMS Microphone (16kHz audio sample stream), DHT22 Digital Temperature & Humidity Sensor, MPU6050 6-axis Accelerometer/Gyroscope for physical motion.'
        },
        audio: {
            title: 'Audio Feature Extraction & DSP Pipeline',
            body: 'Noise reduction filter, FFT spectrogram conversion, and 13-coefficient Mel-Frequency Cepstral Coefficients (MFCC) feature extraction.'
        },
        ai: {
            title: 'AI Emotion-Aware Deep Learning Model',
            body: 'Convolutional Neural Network (CNN) trained on baby cry acoustic datasets to classify needs: Sleepy, Hungry, Discomfort, or Abnormal Cry Distress.'
        },
        esp: {
            title: 'ESP32 Microcontroller & Rule Decision Engine',
            body: 'Evaluates AI classification confidence, executes PWM motor control logic, manages MQTT cloud sync, and triggers local buzzer/audio alerts.'
        },
        motor: {
            title: 'DC Servo Cradle Actuator Motor',
            body: 'Receives PWM duty cycle signals from ESP32 to rock cradle smoothly at Slow (20%), Medium (35%), or Fast (60%) speed.'
        },
        speaker: {
            title: 'I2S Audio DAC & Soothing Speaker',
            body: 'Plays soothing white noise or preloaded lullaby melodies automatically when cry state is detected.'
        },
        alert: {
            title: 'Parent Web & Mobile Notification Endpoint',
            body: 'Pushes real-time WebSocket / REST alert payloads to the web dashboard and parent smartphones when abnormal crying occurs.'
        }
    };

    const data = detailsMap[nodeType];
    if (data) {
        titleEl.innerHTML = `<i class="fa-solid fa-circle-info text-cyan"></i> ${data.title}`;
        bodyEl.textContent = data.body;
        showToast(`Inspecting Architecture Node: ${data.title}`, 'info');
    }
}

function saveSettings() {
    const ip = document.getElementById('cfgEspIp').value;
    showToast(`ESP32 Target IP configured: ${ip}`, 'success');
}
