# Visualisierung von Transitionen zwischen und auf Webseiten für Usability-Studien mit Eyetracking

- Der Datensatz wurde aus rechtlichen Gründen entfernt. 
- Wenn das Papier zu dem Datensatz (https://dx.doi.org/10.475/123_4) veröffentlicht wird,
kann der Datensatz umgewandelt werden.
    1. Füge den Datensatz in "dataset/StimuliDiscovery/original_data" ein.
    2. Starte die Datei "dataset/StimuliDiscovery/create_data_structure.py".
	3. Starte die Datei "dataset/StimuliDiscovery/copyVideos.bat".
	4. Erstelle Vorschaubilder zu den Bildern aus "dataset/StimuliDiscovery/images". 
	5. Speichere die Vorschaubilder mit den gleichen Namen in "dataset/StimuliDiscovery/images/thumb".
	6. (Optional) Die Videos in "dataset/StimuliDiscovery/videos" liegen im .webm Format vor und können nach .mp4 konvertiert werden, damit das Video von mehr Browsern unterstützt wird.
	    * In der dazugehörigen Arbeit wurden die Videos mit [HandBrake](https://handbrake.fr/) mit der Einstellung "Fast 1080p30" konvertiert.
		* Um die Videos mit [FFmpeg](https://ffmpeg.org/) zu konvertieren, kann "dataset/StimuliDiscovery/transformVideos.bat" verwendet werden.
		
## Wenn der Datensatz erfolgreich transformiert wurde:
* Bringe die Software auf einem Server zur Ausführung:
    1. Starte http_server_py.py, um einen lokalen Python-Server zu starten (dafür muss Python installiert sein).
    2. Öffne die Seite http://localhost:8080 oder http://127.0.0.1:8080 in einem beliebigen Browser.
    * Alternativ kann ein anderer Server als der Python-Server verwendet werden, wie z. B. ein Webserver.
