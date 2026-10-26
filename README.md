# Anthony Franz | Portfolio

Persönliche Portfolio-Website von Anthony Franz, Informatiker EFZ mit Spezialisierung in Applikations- und Plattformentwicklung.

🔗 **Live:** [44erhaze.github.io](https://44erhaze.github.io)

## Inhalt

- Vorstellung und aktuelle Tätigkeit
- Tech-Stack nach Bereichen
- Ausgewählte Projekte
- Kontakt

## Besonderheiten

### 3D-Schreibtisch
Im Hero-Bereich steht ein interaktiver 3D-Schreibtisch, gebaut mit [Three.js](https://threejs.org).

### Labor-Terminal
Ein Doppelklick auf den Monitor öffnet ein Terminal. Mit `help` werden alle Befehle angezeigt. Esc, `exit` oder ein Klick auf den dunklen Hintergrund schliessen es.

## Lokal ausführen

Die Seite braucht einen lokalen Webserver, weil der Browser ES-Module (`desk.js`) nicht über `file://` lädt.

```bash
# Im Projektordner
python -m http.server 8000
```

Dann im Browser `http://localhost:8000` öffnen.

Alternativ funktioniert die VS-Code-Erweiterung *Live Server*.

## Technologien

- HTML5, CSS3, JavaScript (ES-Module)
- [Three.js](https://threejs.org) 0.160.0 (über CDN)
- Font Awesome und Google Fonts (über CDN)
- Hosting über GitHub Pages

## Lizenz

Siehe [LICENSE](LICENSE).

---

© 2026 Anthony Franz
