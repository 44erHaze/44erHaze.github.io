# Anthony Franz | Portfolio

Persönliche Portfolio-Website von Anthony Franz, Informatiker EFZ mit Spezialisierung in Applikations- und Plattformentwicklung.

🔗 **Live:** [44erhaze.github.io](https://44erhaze.github.io)

## Inhalt

- Vorstellung mit Schreibmaschinen-Effekt im Untertitel
- Interaktiver 3D-Schreibtisch mit Terminal
- Lebenslauf als eingebettete Vorschau und Download
- Tech-Stack nach Bereichen
- Aktuelle Tätigkeit, Ziele bis 2029
- Ausgewählte Projekte mit Detailansicht (README aus GitHub)
- Kontaktformular
- Datenschutzerklärung

## Besonderheiten

### 3D-Schreibtisch
Im Hero-Bereich steht ein interaktiver 3D-Schreibtisch, gebaut mit [Three.js](https://threejs.org).

- **Schwingen:** Der Tisch dreht sich sanft, damit der Bildschirm lesbar bleibt.
- **Drehen und Zoomen:** Mit Maus oder Touch lässt sich die Szene steuern.
- **Ausschalten:** Der Button "3D ausschalten" zeigt den Text als normalen Block.
- **Barrierefreiheit:** Mit aktivierter Option "Bewegung reduzieren" im Betriebssystem bleibt der Tisch still. Fehlt WebGL, erscheint der Text ohne 3D.

### Labor-Terminal
Ein Doppelklick auf den Monitor öffnet ein Terminal. Mit `help` werden alle Befehle angezeigt. Esc, `exit` oder ein Klick auf den dunklen Hintergrund schliessen es.

### Versteckte Easter Eggs
- **Konami-Code** (↑ ↑ ↓ ↓ ← → ← → B A): schaltet einen Matrix-Regen im Hintergrund ein und aus. Der Hinweis steht im Footer und als Aufkleber auf der Rückseite des Monitors.
- **Terminal-Befehle:** `sudo hire-me` und `matrix` sind in `help` aufgeführt.

### Kontaktformular
Das Formular sendet über [Web3Forms](https://web3forms.com) direkt an meine E-Mail-Adresse. Der Access Key steht in der `index.html` und ist nicht geheim, er erlaubt nur das Absenden an diese Adresse.

### Projekt-Detailansicht
Ein Klick auf eine Projektkarte öffnet ein Fenster mit dem README des jeweiligen GitHub-Repos. Der Inhalt wird mit [marked](https://marked.js.org) umgewandelt und mit [DOMPurify](https://github.com/cure53/DOMPurify) bereinigt. Fehlt das README, erscheint die Kurzbeschreibung.

## Lokal ausführen

Die Seite braucht einen lokalen Webserver, weil der Browser ES-Module (`desk.js`, `projects.js`) nicht über `file://` lädt.

```bash
# Im Projektordner
python -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.

Alternativ funktioniert die VS-Code-Erweiterung *Live Server*.

## Technologien

- HTML5, CSS3, JavaScript (ES-Module)
- [Three.js](https://threejs.org) 0.160.0 (über CDN)
- [marked](https://marked.js.org) und [DOMPurify](https://github.com/cure53/DOMPurify) (über CDN)
- Font Awesome, Google Fonts (über CDN)
- Web3Forms für das Kontaktformular
- Hosting über GitHub Pages

## Lizenz

Siehe [LICENSE](LICENSE).

---

© 2026 Anthony Franz
