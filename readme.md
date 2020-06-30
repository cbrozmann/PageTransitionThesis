# Visualisierung von Transitionen zwischen und auf Webseiten für Usability-Studien mit Eyetracking

- Der Datensatz ist erhältlich unter [Datensatz](https://zenodo.org/record/3908124).
	1. Downloade und entpacke den Datensatz.
	2. Füge die Ordner "Dataset_visual_change" und "Dataset_stimuli" des Datensatzes in "dataset/StimuliDiscovery/original_data" ein.
    3. Starte die Datei "dataset/StimuliDiscovery/create_data_structure.py".
	4. Starte die Datei "dataset/StimuliDiscovery/copyVideos.bat".
	5. (Optional) Die Videos in "dataset/StimuliDiscovery/videos" liegen im .webm Format vor und können nach .mp4 konvertiert werden, damit das Video von mehr Browsern unterstützt wird.
	    * In der dazugehörigen Arbeit wurden die Videos mit [HandBrake](https://handbrake.fr/) mit der Einstellung "Fast 1080p30" konvertiert.
		* Um die Videos mit [FFmpeg](https://ffmpeg.org/) zu konvertieren, kann "dataset/StimuliDiscovery/transformVideos.bat" verwendet werden.
	6. (Optional) Erstelle Vorschaubilder zu den Bildern aus "dataset/StimuliDiscovery/images" (mit gleichem Seitenverhältnis).
	7. (Optional) Speichere die Vorschaubilder mit den gleichen Namen in "dataset/StimuliDiscovery/images/thumb".
	
## Wenn der Datensatz erfolgreich transformiert wurde:
* Bringe die Software auf einem Server zur Ausführung:
    1. Starte http_server_py.py, um einen lokalen Python-Server zu starten (dafür muss Python installiert sein).
    2. Öffne die Seite http://localhost:8080 oder http://127.0.0.1:8080 in einem beliebigen Browser.
    * Alternativ kann ein anderer Server als der Python-Server verwendet werden, wie z. B. ein Webserver.
