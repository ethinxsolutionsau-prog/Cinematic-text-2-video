# Cinematic Text-to-Video Generator

A modular, robust python application for generating high-fidelity cinematic video clips from natural language prompt descriptions. It utilizes Hugging Face Diffusion Pipelines for model inference with native GPU/CPU hardware acceleration detection, and compiles smooth outputs cleanly.

## Project Structure

```text
Cinematic-text-2-video/
├── models/                     # Model weight directory
├── src/                        # Core application modules
│   ├── video_generator.py      # Diffusion pipeline handler & procedural renderer
│   └── utils.py                # Logger and folder utilities
├── outputs/                    # Compiled video outputs (.mp4)
├── requirements.txt            # Package dependencies
├── README.md                   # Setup and usage guide
└── test.py                     # Entry point simulation script
```

## Setup & Run Instructions

### 1. Install Dependencies

Install the required system and Python dependencies using `pip`:

```bash
pip install -r requirements.txt
```

### 2. Download Model Weights

Create the target model weights directory and download your chosen stable-diffusion or text-to-video pipeline weights into the `./models/` subdirectory:

```bash
mkdir -p models
# Example downloading stable-diffusion weights via huggingface-cli:
# huggingface-cli download runwayml/stable-diffusion-v1-5 --local-dir ./models/stable-diffusion-v1-5
```

### 3. Run Validation Test

Run the validation suite to test the setup. If local weights are not present, the generator falls back into a high-fidelity procedural video compiler to verify that OpenCV and NumPy systems function seamlessly on your platform:

```bash
python test.py
```
