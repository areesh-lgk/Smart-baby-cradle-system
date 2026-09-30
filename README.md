# Smart Cradle AI

### AI-Based Smart Baby Cradle System with Emotion-Aware Cry Recognition

> **An AI and IoT-enabled intelligent baby monitoring and automated cradle system designed to recognize baby cry patterns, monitor environmental conditions, and provide real-time parental assistance.**

---

## Overview

**Smart Cradle AI** is an AI-powered IoT prototype that combines **audio-based cry analysis, embedded systems, sensor monitoring, automated cradle control, and a real-time web dashboard** into a single intelligent baby-care platform.

The system captures baby audio, processes the signal, identifies a **probable cry pattern**, and triggers a predefined response through the smart cradle. Environmental parameters and system status are simultaneously monitored through an IoT-enabled dashboard.

The project demonstrates the integration of **Artificial Intelligence, Internet of Things, Embedded Systems, and Web Technologies** for intelligent and responsive baby-care applications.

> **Prototype Disclaimer:** Cry classifications represent probabilistic AI outputs for research and demonstration purposes and are not medical diagnoses.

---

## Problem Statement

Traditional baby cradles primarily provide mechanical movement and do not intelligently interpret baby crying or environmental conditions.

Parents may also find it difficult to continuously monitor a baby while working, sleeping, or performing other activities.

The project addresses this gap by developing a system capable of:

* Detecting baby crying
* Analyzing cry patterns using AI
* Monitoring environmental conditions
* Automating cradle movement
* Providing real-time system information
* Notifying parents when attention may be required

---

## Proposed Solution

The system follows an integrated AI-IoT workflow:

```text
Baby Cry
   ↓
Audio Capture
   ↓
Signal Processing
   ↓
Feature Extraction
   ↓
AI Cry Classification
   ↓
Probable Cry Pattern
   ↓
Decision Engine
   ↓
┌───────────────┬────────────────┐
│               │                │
Cradle Control  Soothing Audio   Parent Alert
│                                │
└───────────────┬────────────────┘
                ↓
         Web Dashboard
```

---

## Key Features

### AI-Based Cry Recognition

Processes baby cry audio and classifies probable cry patterns such as:

* Hungry
* Sleepy
* Discomfort
* Abnormal Cry Pattern
* Calm

### Real-Time Monitoring

Monitors:

* Temperature
* Humidity
* Baby movement
* Cry intensity
* Cradle status
* System connectivity

### Automated Cradle Control

Automatically adjusts cradle operation according to configured prototype rules.

### Parent Notification

Provides real-time alerts when specific cry patterns or configured conditions require attention.

### Web Dashboard

Provides a centralized interface for:

* Live monitoring
* AI analysis
* Sensor data
* Cradle control
* Alerts
* Historical analytics

### Demo Mode

Includes an end-to-end simulation for demonstrating:

```text
Detection → Analysis → Classification → Response → Notification
```

---

## System Architecture

```text
                    ┌──────────────┐
                    │     BABY     │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │   Microphone    │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Audio Processing│
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  AI/ML Model    │
                  │ Cry Classification│
                  └────────┬────────┘
                           │
                           ▼
                     ┌──────────┐
                     │  ESP32   │
                     └────┬─────┘
                          │
            ┌─────────────┼─────────────┐
            │             │             │
            ▼             ▼             ▼
       Environmental   Cradle        Speaker
         Sensors       Motor        / Buzzer
            │             │             │
            └─────────────┼─────────────┘
                          │
                          ▼
                    Wi-Fi / IoT
                          │
                          ▼
                 ┌────────────────┐
                 │ Web Dashboard  │
                 └───────┬────────┘
                         │
                         ▼
                   Parent Alerts
```

---

## Technology Stack

| Layer             | Technologies                               |
| ----------------- | ------------------------------------------ |
| **Frontend**      | HTML5, CSS3, JavaScript                    |
| **Visualization** | Chart.js                                   |
| **AI/ML**         | Python, Librosa, Scikit-learn / TensorFlow |
| **Embedded**      | ESP32, Embedded C/C++                      |
| **Sensors**       | DHT22, MPU6050, Microphone                 |
| **Actuation**     | Servo / DC Motor, Motor Driver             |
| **Communication** | Wi-Fi, REST API / MQTT                     |
| **IoT Dashboard** | Web-based monitoring interface             |

---

## AI Processing Pipeline

The audio processing pipeline is designed around standard audio-classification techniques:

```text
Audio Input
     ↓
Noise Reduction
     ↓
Signal Normalization
     ↓
Feature Extraction
     ↓
MFCC / Audio Features
     ↓
Machine Learning Model
     ↓
Cry Pattern Classification
```

### Potential ML Models

* Support Vector Machine (SVM)
* Random Forest
* Convolutional Neural Network (CNN)

The model architecture can be selected based on dataset size, computational requirements, and deployment constraints.

---

## Prototype Workflow

### 1. Cry Detection

The microphone captures the baby's audio signal.

### 2. Audio Processing

The captured signal is filtered and prepared for analysis.

### 3. AI Classification

Relevant audio features are extracted and passed to the classification model.

### 4. Decision Processing

The detected pattern is mapped to a predefined prototype response.

### 5. Cradle Automation

The cradle can perform an appropriate configured action such as gentle movement or soothing audio.

### 6. Parent Notification

The system generates an alert when a configured condition requires attention.

### 7. Dashboard Update

Sensor readings, AI results, cradle status, and alerts are displayed on the web interface.

---

## Web Dashboard

The dashboard provides a centralized monitoring interface containing:

### Live Status

* Baby status
* Cry detection
* AI classification
* Confidence level
* Cradle state

### Sensor Monitoring

* Temperature
* Humidity
* Movement
* Cry intensity

### Cradle Control

* Auto mode
* Manual mode
* Motor ON/OFF
* Motion speed
* Soothing audio

### Analytics

* Cry frequency
* Cry category distribution
* Temperature trends
* Cradle activity
* Alert history

---

## Example AI Output

```text
AI CRY ANALYSIS
────────────────────────────

Status            : Cry Detected
Probable Pattern  : Sleepy
Confidence        : 87%

Hungry            : 12%
Sleepy            : 67%
Discomfort        : 16%
Abnormal Pattern  : 5%

Cradle Mode       : Gentle
Motor Status      : ON
Parent Alert      : SENT
```

---

## Project Structure

```text
smart-cradle-ai/
│
├── index.html
├── dashboard.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── dashboard.js
│   ├── ai-analysis.js
│   ├── sensors.js
│   ├── cradle-control.js
│   └── alerts.js
│
├── ai/
│   ├── dataset/
│   ├── preprocessing.py
│   ├── feature_extraction.py
│   └── train_model.py
│
├── esp32/
│   └── smart_cradle.ino
│
├── assets/
│   ├── images/
│   └── icons/
│
├── docs/
│   ├── architecture.png
│   └── prototype.png
│
└── README.md
```

---

## Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/<your-username>/smart-cradle-ai.git
cd smart-cradle-ai
```

### Run the Web Prototype

Open the project using **Visual Studio Code** and launch the application with Live Server.

Alternatively, open:

```text
index.html
```

in a modern web browser.

### AI Environment

Create a Python environment and install the required dependencies:

```bash
pip install librosa numpy pandas scikit-learn matplotlib
```

Additional dependencies can be installed based on the selected ML model.

---

## Prototype Demonstration

The integrated demonstration follows:

```text
1. System Initialization
        ↓
2. Audio Monitoring
        ↓
3. Cry Detection
        ↓
4. AI Processing
        ↓
5. Cry Pattern Classification
        ↓
6. Automated Cradle Response
        ↓
7. Parent Notification
        ↓
8. Dashboard Update
```

A dedicated **Demo Mode** is included to simulate the complete workflow without requiring physical hardware.

---

## Innovation

The core innovation of the prototype is the integration of:

**AI + Audio Processing + IoT + Embedded Automation + Web Monitoring**

into a single baby-care platform.

Unlike a basic automatic cradle, the proposed system introduces an **AI-assisted decision layer** between cry detection and cradle response.

---

## Applications

Potential applications include:

* Smart baby monitoring
* Connected baby-care systems
* Home IoT automation
* AI-assisted parental monitoring
* Smart healthcare research
* Embedded AI research prototypes

---

## Future Scope

The system can be extended with:

* Larger and more diverse cry datasets
* Personalized cry models
* Edge-AI deployment directly on embedded hardware
* Cloud-based analytics
* Mobile application
* MQTT-based communication
* Advanced anomaly detection
* Secure user authentication
* Long-term behavioral analytics
* Optional computer-vision integration
* Low-power IoT architecture

---

## Limitations

* AI accuracy depends on the quality and diversity of the training dataset.
* Environmental noise can affect audio classification.
* Cry categories are probabilistic and may not represent the baby's actual need.
* Prototype automation rules require validation before any real-world deployment.
* The system is not intended to replace parental supervision or professional medical advice.

---

## Project Status

**Status:** `Prototype / SIH Hackathon Project`

| Component          | Status          |
| ------------------ | --------------- |
| Web Dashboard      | ✅ Completed     |
| UI/UX              | ✅ Completed     |
| Sensor Simulation  | ✅ Implemented   |
| AI Analysis Module | 🔄 Prototype    |
| ESP32 Integration  | 🔄 Prototype    |
| Automated Cradle   | 🔄 Prototype    |
| Parent Alerts      | 🔄 Prototype    |
| Cloud Integration  | 🔮 Future Scope |

---

## Hackathon Information

**Event:** Smart India Hackathon (SIH)

**Project Title:**
**AI-Based Smart Baby Cradle System with Emotion-Aware Cry Recognition**

**Domain:**
Artificial Intelligence • IoT • Embedded Systems • Web Technology

---

## Author

**A. Areesh**

Electronics & Communication Engineering
Embedded Systems | IoT | AI/ML | Python | Web Development

---

## Disclaimer

This project is developed as an **educational and hackathon prototype**.

AI-generated cry classifications are probabilistic outputs intended for research and demonstration. They should not be considered medical diagnoses or used as a substitute for parental supervision, pediatric evaluation, or emergency medical services.

---

## License

This project is intended for educational, research, and hackathon purposes.

Add an appropriate open-source license before distributing the project publicly.
