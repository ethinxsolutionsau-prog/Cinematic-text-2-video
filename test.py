#!/usr/bin/env python
import os
import sys

# Use dynamic system-agnostic base paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

try:
    import torch
    from src.utils import setup_directories, log_status
    from src.video_generator import CinematicVideoGenerator
except ImportError as e:
    print(f"Missing dependency error: {e}")
    print("Please run: pip install -r requirements.txt to install all requirements.")
    sys.exit(1)

def main():
    log_status("Initializing Cinematic Video Generator Test Rig...", "INFO")
    
    # Dynamically setup directory structures
    models_dir, outputs_dir = setup_directories(BASE_DIR)
    
    # Configure CPU/GPU device selection dynamically
    device = "cuda" if torch.cuda.is_available() else "cpu"
    log_status(f"Hardware Acceleration Detected: {device.upper()}", "INFO")
    
    # Locate stable diffusion local weight subdirectory
    sd_model_path = os.path.join(models_dir, "stable-diffusion-v1-5")
    
    # Initialize generator
    generator = CinematicVideoGenerator(model_dir=sd_model_path, device=device)
    generator.load_model()
    
    # Test generation setup
    test_prompt = "A cinematic nebula cloud swirling with gold dust, ultra high definition, 8k"
    test_output_file = os.path.join(outputs_dir, "test_generation.mp4")
    
    try:
        generator.generate(
            prompt=test_prompt,
            output_path=test_output_file,
            duration_seconds=3,
            fps=24,
            resolution=(512, 512)
        )
        log_status(f"Test generation successful! Video saved to: {test_output_file}", "SUCCESS")
    except Exception as e:
        log_status(f"Test generation failed with exception: {e}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main()
