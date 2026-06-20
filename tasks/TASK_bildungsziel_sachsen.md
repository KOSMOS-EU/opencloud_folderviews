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

#### 4.1 Schüler-Ansicht via classes-Dienst (IN PLANUNG — Priorität 1)
Der **classes-Dienst** ist das Schüler-Portal — nicht OpenCloud selbst.

```
Schüler → Schullogin (OIDC) → classes-Dienst → sieht Themen → bearbeitet Aufgaben
```

- **Single Login** für Schüler über classes-Dienst
- **OIDC Federation** mit Sachsens zentralem IDP **Schullogin**
- classes liest `.classes/klasse_YYYY.md` aus dem Space (Mapping Schullogin-ID ↔ Token)
- classes rendert Themen + Aufgaben als Schüler-Ansicht (eigene Web-App)
- Lehrkraft verwaltet Inhalte weiterhin in OpenCloud Web (folderviews Extension)
- Schüler interagiert **nur** mit classes (kein OpenCloud-Account nötig)
- classes greift per **Service Account** (WebDAV) auf den Lernen-Space zu

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

#### 4.6 Integration Schullogin / LernSax (GEPLANT — Infrastruktur)
**Ansatz**: classes-Dienst ist der OIDC-Client gegenüber Schullogin.

- **classes-Dienst** authentifiziert Schüler via Schullogin (OIDC)
- Schullogin liefert Benutzer-ID → classes mappt auf Token in `.classes/`
- **Lehrkräfte** loggen sich direkt in OpenCloud ein (eigenes OIDC oder Schullogin)
- OpenCloud muss nicht direkt an Schullogin angebunden werden (classes vermittelt)
- Alternativ: OpenCloud IDP Federation mit Schullogin für Lehrkräfte

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
│  classes-Dienst (Schüler-Portal)                     │
│  ├── Login via Schullogin (OIDC Federation)          │
│  ├── Schullogin-ID → Token-Mapping aus .classes/     │
│  ├── Liest Lernplan + Themen + .task per WebDAV      │
│  ├── Rendert Schüler-Ansicht (eigene Web-App)        │
│  ├── Aufgaben-Abgabe + Selbstkorrektur               │
│  ├── Fortschritt-Tracking (🔴🟡🟢)                  │
│  ├── Sichtbarkeitssteuerung (Datum + Klasse)          │
│  ├── Kompetenz-Dashboard                             │
│  └── Service Account → OpenCloud WebDAV              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Was Sachsen sofort nutzen könnte (Phase 1 — Lehrer-Seite)

1. **OpenCloud Space "Lernen"** pro Schule/Fachschaft
2. **Lehrkraft** erstellt Lernbereiche + Themen per Metro-View + CreateDialog
3. **Aufgaben** mit Links zu YouTube, LearningApps, bettermarks, MeSax etc.
4. **Klassenlisten** in `.classes/klasse_YYYY.md`
5. **FolderSettings** zum Anpassen von Nummer, Farbe, Beschreibung

Das deckt die **Lehrer-Seite** von Kompetenz.Digital komplett ab.

## Was gebaut werden muss (Phase 2 — classes-Dienst = Schüler-Seite)

1. **classes-Dienst**: Login via Schullogin → Schüler-Ansicht
2. **Themen-Rendering**: Liest .task + seite.md, zeigt als Aufgaben-Karten
3. **Aufgaben-Abgabe**: Upload/Text/Erledigt-Markierung
4. **Fortschritt-Dashboard**: Lehrkraft sieht 🔴🟡🟢 pro Schüler
5. **Zeitsteuerung**: Themen ab Datum X für Klasse Y sichtbar
6. **Selbstkorrektur**: Lösungstext anzeigen nach Bearbeitung

## Mapping auf Sachsen-Anforderungen

| Sachsen braucht | Unser Feature | Status |
|----------------|---------------|--------|
| Lernmaterial strukturieren | Lernplan/Thema Hierarchie | ✅ |
| Aufgaben mit Video/Links/AB | .task Format + LearnEditor | ✅ |
| Fächer-Übersicht | Metro-View farbige Kacheln | ✅ |
| Lehrkraft erstellt Inhalte | CreateDialog + LearnEditor | ✅ |
| Metadata bearbeiten | FolderSettings Sidebar | ✅ |
| Klassen verwalten | .classes/ Token-Listen | ✅ |
| Schüler-Ansicht | classes-Dienst (Schullogin OIDC) | 🔧 zu bauen |
| Aufgaben-Abgabe | classes-Dienst | 🔧 zu bauen |
| Fortschritt-Tracking | classes-Dienst Dashboard | 🔧 zu bauen |
| Zeitsteuerung | oy.visibleFrom Metadata | ❌ geplant |
| Kompetenz-Checkliste | .task competencies + Dashboard | ❌ geplant |
| Schullogin-Integration | classes-Dienst OIDC Federation | 🔧 zu bauen |
| bettermarks/LearningApps | Links in .task description | ✅ (extern) |
| Offline-Fähigkeit | PWA / lokaler Cache | ❌ optional |
