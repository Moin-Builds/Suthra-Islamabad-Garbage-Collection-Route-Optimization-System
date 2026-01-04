@echo off
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo Python not found. Install Python and tick "Add to PATH".
  pause
  exit /b 1
)
echo Installing requirements...
python -m pip install -r requirements.txt
echo Running demo...
python main.py --bins 20000 --trucks 6 --candidates 40 --mode both
echo Done. Check output\serial\route_map.png and output\parallel\route_map.png
pause
