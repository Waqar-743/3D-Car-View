#  F1 Experience - 3D Car Configurator

A premium, interactive 3D Formula 1 car viewer built with React, TypeScript, and Three.js. Experience engineering perfection with stunning visuals, cinematic camera modes, and detailed technical specifications.

![F1 Experience](https://img.shields.io/badge/F1-Experience-red?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Three.js](https://img.shields.io/badge/Three.js-0.160-black?style=for-the-badge&logo=three.js)

---

##  Features

###  Interactive 3D Viewer
- **360° Car Exploration** - Rotate, zoom, and pan around high-fidelity F1 car models
- **Multiple Camera Modes** - Choose between free camera, orbit, and cinematic views
- **Auto-Rotate** - Smooth automatic rotation for showcase mode

### Customization
- **Color Picker** - 8 premium paint finishes including:
  - Papaya Orange
  - Racing Red
  - British Green
  - Gulf Blue
  - Midnight Black
  - Silver Arrow
  - Oracle Blue
  - Alpine White
- **Metallic Materials** - Realistic car paint with clearcoat and metalness

###  Cinematic Demo Mode
- **Automatic Camera Animation** - Professional cinematic camera movements
- **Dark-to-Light Reveal** - Dramatic spotlight transition effect
- **30-Second Timeout** - Auto-activates after inactivity
- **Skip Anytime** - Press ESC or click Skip button

###  Interactive Hotspots
- **Technical Specifications** - Click on car parts to learn details:
  - Front Wing Assembly
  - Halo Protection System
  - Power Unit Bay
  - Rear Wing & DRS
  - Sidepod & Cooling
- **Animated Markers** - Pulsing cyan indicators
- **Detailed Modals** - Rich information panels

###  Special Effects
- **Triple-Click Spotlight Mode** - Click car 3 times for dramatic yellow spotlight effect
- **Garage Environment** - Realistic walls, floor, and ambient lighting
- **Wall Decorations** - F1 posters and racing imagery

###  Fully Responsive
- **Mobile Optimized** - Compact UI for small screens
- **Reduced Animations** - Simplified effects on mobile for performance
- **Touch Friendly** - Full touch gesture support

---

##  Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/f1-experience.git

# Navigate to project directory
cd f1-experience

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3002`

### Build for Production

```bash
npm run build
```

---

##  Usage

### Controls
| Action | Desktop | Mobile |
|--------|---------|--------|
| Rotate View | Left Click + Drag | One Finger Drag |
| Pan View | Right Click + Drag | Two Finger Drag |
| Zoom | Scroll Wheel | Pinch |
| Reset View | Click Home Icon | Click Home Icon |
| Toggle Auto-Rotate | Click Rotate Icon | Click Rotate Icon |
| Fullscreen | Click Expand Icon | Click Expand Icon |
| Skip Demo | Press ESC | Tap Skip Button |
| Spotlight Mode | Triple-Click Car | Triple-Tap Car |

### Keyboard Shortcuts
- `ESC` - Exit demo mode / Exit fullscreen
- `R` - Reset camera view

---

## 📁 Project Structure

```
car-work/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   └── PanoramicViewer/
│   │       ├── PanoramicViewer.tsx    # Main component
│   │       ├── PanoramicCanvas.tsx    # Three.js canvas
│   │       ├── CarModel.tsx           # 3D car loader
│   │       ├── Lighting.tsx           # Scene lighting
│   │       ├── GarageEnvironment.tsx  # Walls & floor
│   │       ├── CarSelector.tsx        # Car switcher
│   │       ├── Controls.tsx           # UI controls
│   │       ├── ColorPicker.tsx        # Paint selector
│   │       ├── DemoButton.tsx         # Cinematic toggle
│   │       ├── Hotspots.tsx           # Interactive points
│   │       ├── LoadingOverlay.tsx     # Pre-loader
│   │       └── SkipDemoButton.tsx     # Demo skip
│   ├── config/
│   │   └── carModels.ts               # Car configurations
│   ├── store/
│   │   └── carStore.ts                # Zustand state
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                      # Tailwind styles
├── img/
│   └── 3d-Model/                      # GLB car models
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

---

## 🏁 Available Cars

| Car | Team | Year |
|-----|------|------|
| MCL38 | McLaren | 2024 |
| W15 | Mercedes | 2024 |
| RB20 | Red Bull | 2024 |

---

## ⚡ Performance

- **Optimized Loading** - Progressive asset loading with visual feedback
- **Reduced Shadows** - Balanced quality vs performance
- **Mobile-First Animations** - Simplified effects on smaller devices
- **Efficient State Management** - Zustand for minimal re-renders

---

## 🛠️ Tech Stack

See [TECH_STACK.md](./TECH_STACK.md) for detailed information about all technologies used.

---

## 📄 License

This project is for educational and demonstration purposes.

F1, Formula 1, and related marks are trademarks of Formula One Licensing BV.

---

## 🙏 Acknowledgments

- Three.js community for excellent 3D rendering
- React Three Fiber for React integration
- Sketchfab artists for 3D car models
- Formula 1 for inspiration

---

<p align="center">
  <strong>Built with ❤️ </strong>
</p>
