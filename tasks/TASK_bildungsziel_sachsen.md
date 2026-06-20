# TASK: Bildungsziel Sachsen — Selbstlernen.Digital auf OpenCloud

## Kontext

Sachsen startet ab SJ 2025/26 "Selbstlernen.Digital" mit zwei Stufen:
- **Kompetenz.Digital**: 15 Pflichtstunden/Jahr digitale Lernkompetenz
- **Selbstlernzeit.Digital**: Regelmäßige Selbstlernphasen, beaufsichtigt ohne Lehrkraft

## Was braucht man digital? → Was wir liefern

### 1. Lernmaterial-Struktur (✅ haben wir)
- **Lernplan-Hierarchie**: Fach → Themenbereich → Thema (Ordner-Baum)
- **Aufgaben-Typen**: Video, Arbeitsblatt, Weblink, LearningApp, Selbsttest, Kreativ
- **.task JSON-Format**: Strukturierte Aufgabenbeschreibung mit Sozialform, Zeitaufwand, Abgabeform
- **seite.md**: Thema-Beschreibung mit Lernzielen
- **Metro-View**: Farbige Kacheln mit Nummerierung und Beschreibung
- **Leaf is Application**: Klick auf Thema öffnet Editor/Viewer

### 2. Lernmaterial-Erstellung (✅ haben wir)
- **CreateDialog**: Neuer Lernbereich / Neues Thema anlegen mit Farbe + Beschreibung
- **LearnEditor**: seite.md + .task Dateien bearbeiten, Aufgaben-Grid mit Typ/Icon/Farbe
- **deploy_content.sh**: Massendeployment von Inhalten per Script
- **FolderSettings**: Metadata (Nummer, Farbe, Beschreibung) per Sidebar bearbeiten

### 3. Klassenverwaltung (✅ haben wir — Basis)
- **.classes/klasse_YYYY.md**: Token-basierte Schülerlisten
- **parseClassFile**: Parser für Token-Dateien
- **useClasses composable**: Laden + Parsen der Klassendateien

### 4. Was fehlt für Sachsen → Roadmap

#### 4.1 Schüler-Ansicht (FEHLT — Priorität 1)
**Problem**: Aktuell gibt es nur die Lehrer-/Admin-Ansicht.
**Lösung**: Schüler-Portal als separater Dienst oder Public-Link-View

```
Schüler öffnet Link → sieht seine Themen → klickt Aufgabe → bearbeitet
```

Optionen:
- **A) OpenCloud Public Link**: Space per Public Link teilen, Read-Only
  - Schüler braucht keinen Account
  - Intranet-httpd rendert die Themen als HTML-Seite
  - QR-Code pro Klasse/Thema
- **B) classes-Dienst**: Separater Login per Token
  - Schüler-spezifische Sichtbarkeit
  - Aufgaben-Abgabe möglich
  - Fortschritt-Tracking

#### 4.2 Aufgaben-Abgabe (FEHLT — Priorität 2)
**Problem**: Schüler können Aufgaben aktuell nicht abgeben.
**Was Sachsen braucht**:
- "digital" Abgabeform → Datei-Upload oder Texteingabe
- "Heft" → Foto-Upload
- "mündlich" → keine digitale Abgabe nötig
- Selbstkorrektur → Lösungstext anzeigen + "erledigt" markieren

**Lösung**:
- Abgabe-Ordner pro Schüler: `_submissions/<token>/<thema>/<aufgabe>/`
- Status-Tracking: `.status.json` pro Schüler-Thema
- Korrektur-Workflow: Lehrkraft sieht Abgaben in Editor

#### 4.3 Fortschritt-Tracking (FEHLT — Priorität 2)
**Problem**: Kein Überblick welcher Schüler welche Aufgaben erledigt hat.
**Was Sachsen braucht**:
- Checkliste: Kompetenz erreicht / nicht erreicht
- Dashboard: Klassen-Übersicht pro Thema
- Selbsteinschätzung: Schüler markiert "verstanden" / "brauche Hilfe"

**Lösung**:
- Status pro Schüler+Aufgabe in Metadata oder separater Datei
- Dashboard-View im LearnEditor (Lehrkraft-Sicht)
- Ampel-System: 🔴 nicht begonnen, 🟡 in Arbeit, 🟢 erledigt

#### 4.4 Zeitsteuerung / Sichtbarkeit (FEHLT — Priorität 3)
**Problem**: Lehrkraft will Themen erst ab einem bestimmten Datum freigeben.
**Was Sachsen braucht**:
- Thema ab Datum X sichtbar für Klasse Y
- Zeitfenster für Selbstlernphase

**Lösung**:
- Metadata `oy.visibleFrom`, `oy.visibleUntil`
- Klassen-Zuordnung: `oy.classes: "2025,2026"`
- classes-Dienst filtert nach Datum + Klasse

#### 4.5 Kompetenz-Mapping (FEHLT — Nice-to-have)
**Problem**: Welche Kompetenzen entwickelt jede Aufgabe?
**Was Sachsen braucht**:
- Checkliste: Lern- und Digitalkompetenzen pro Schüler
- Zuordnung Aufgabe → Kompetenz

**Lösung**:
- `.task` Format erweitern: `"competencies": ["KMK-2.1", "Selbstregulation"]`
- Kompetenz-Katalog als `.views/competencies.json`
- Dashboard aggregiert Kompetenzen pro Schüler

#### 4.6 Integration Schullogin / LernSax (FEHLT — Infrastruktur)
**Problem**: Sachsen nutzt Schullogin als zentrale Authentifizierung.
**Lösung**:
- OpenCloud OIDC Federation mit Schullogin
- classes-Dienst mappt Schullogin-IDs auf Space-Tokens
- Oder: Public Links ohne Login (einfacher, weniger Datenschutz-Aufwand)

## Architektur-Übersicht

```
┌─────────────────────────────────────────────────────┐
│                    OpenCloud                         │
│                                                     │
│  Space "Lernen Klasse 8a"                           │
│  ├── .views/lernplan.json, thema.json               │
│  ├── .classes/klasse_2024.md                        │
│  ├── _type_lernplan                                 │
│  ├── 01 Deutsch/                                    │
│  │   ├── _type_lernplan                             │
│  │   ├── Haupt- und Nebensätze/                     │
│  │   │   ├── _type_thema                            │
│  │   │   ├── seite.md                               │
│  │   │   ├── 01_erklaervideo.task                   │
│  │   │   ├── 02_arbeitsblatt.task                   │
│  │   │   └── attachments/AB1.pdf                    │
│  │   └── ...                                        │
│  └── ...                                            │
│                                                     │
│  Folderviews Extension (Lehrer-UI)                  │
│  ├── Metro-View: Farbige Kacheln + Sortierung       │
│  ├── LearnEditor: Themen + Aufgaben bearbeiten      │
│  ├── CreateDialog: Neue Bereiche/Themen anlegen     │
│  ├── FolderSettings: Metadata per Sidebar           │
│  └── Toolbar: Neu-Buttons + Protect/Unprotect       │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Intranet-httpd (Schüler-Ansicht, Read-Only)        │
│  ├── Public Link → Space → HTML-Rendering           │
│  ├── Themen als Karten mit Aufgaben                 │
│  ├── .task → Aufgaben-Kacheln mit Links/Beschreibung│
│  └── QR-Codes pro Klasse/Thema                      │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  classes-Dienst (zukünftig)                          │
│  ├── Token-Login für Schüler                        │
│  ├── Aufgaben-Abgabe                                │
│  ├── Fortschritt-Tracking                           │
│  ├── Sichtbarkeitssteuerung                         │
│  └── Kompetenz-Dashboard                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Was Sachsen sofort nutzen könnte (Phase 1)

1. **OpenCloud Space "Lernen"** pro Schule/Klasse
2. **Lehrkraft** erstellt Lernbereiche + Themen per Metro-View
3. **Aufgaben** mit Links zu YouTube, LearningApps, bettermarks etc.
4. **Public Link** auf den Space → Intranet-httpd rendert als Website
5. **QR-Code** für Schüler → öffnet Themen-Seite im Browser
6. **Keine Accounts nötig** für Schüler (Public Link = Read-Only)

Das deckt Kompetenz.Digital (Stufe 1) komplett ab:
- Lehrkraft erstellt 15 Unterrichtsstunden als Themen
- Jedes Thema hat strukturierte Aufgaben mit Links + Beschreibung
- Schüler arbeiten die Aufgaben selbstständig ab
- Verschiedene Aufgabentypen für verschiedene Lernformen

## Was zusätzlich gebaut werden muss (Phase 2+)

1. **Intranet-httpd**: `.task`-Rendering als Aufgaben-Kacheln
2. **classes-Dienst**: Schüler-Login + Abgabe + Tracking
3. **Dashboard**: Fortschritt pro Schüler/Klasse
4. **Zeitsteuerung**: Themen zeitlich freigeben

## Mapping auf Sachsen-Anforderungen

| Sachsen braucht | Unser Feature | Status |
|----------------|---------------|--------|
| Lernmaterial strukturieren | Lernplan/Thema Hierarchie | ✅ |
| Aufgaben mit Video/Links/AB | .task Format + LearnEditor | ✅ |
| Fächer-Übersicht | Metro-View farbige Kacheln | ✅ |
| Lehrkraft erstellt Inhalte | CreateDialog + LearnEditor | ✅ |
| Metadata bearbeiten | FolderSettings Sidebar | ✅ |
| Klassen verwalten | .classes/ Token-Listen | ✅ |
| Schüler-Ansicht | Intranet-httpd Public Link | ⚡ erweiterbar |
| Aufgaben-Abgabe | classes-Dienst | ❌ geplant |
| Fortschritt-Tracking | classes-Dienst Dashboard | ❌ geplant |
| Zeitsteuerung | oy.visibleFrom Metadata | ❌ geplant |
| Kompetenz-Checkliste | .task competencies + Dashboard | ❌ geplant |
| Schullogin-Integration | OIDC Federation | ❌ Infrastruktur |
| bettermarks/LearningApps | Links in .task description | ✅ (extern) |
| Offline-Fähigkeit | PWA / lokaler Cache | ❌ optional |
