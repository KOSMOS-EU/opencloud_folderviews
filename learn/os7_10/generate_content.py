#!/usr/bin/env python3
"""
Generates learning content for Oberschule Klassen 7-10.
8 Fächer × 4 Themen × 5 Aufgaben = 160 Aufgaben.
Output: JSON + Markdown files in subject/topic/ directories.
"""
import json, os, pathlib

SUBJECTS = [
    {
        "name": "Deutsch",
        "color": "#8B1A1A",
        "ref": "01",
        "note": "Sprache, Literatur, Medien",
        "topics": [
            {
                "name": "Argumentieren und Erörtern",
                "ref": "01.01",
                "description": """## Lernziele

- Du kannst eine **These** formulieren und mit **Argumenten** stützen.
- Du kennst den Unterschied zwischen **linearer** und **dialektischer Erörterung**.
- Du kannst **Gegenargumente** entkräften.
- Du wendest die **Sanduhr-Methode** an.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Erörterung schreiben", "icon": "play-circle", "color": "#1565C0",
                     "description": "Schau dir das Video zur Erörterung an und notiere die **5 Schritte** einer gelungenen Erörterung.\n\n🔗 https://www.youtube.com/watch?v=QhzpGOrICBM",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "weblink", "title": "Recherche: Pro & Contra Schuluniformen", "icon": "globe", "color": "#00838F",
                     "description": "Recherchiere im Internet **mindestens 4 Pro- und 4 Contra-Argumente** zum Thema Schuluniformen. Nutze verschiedene Quellen.\n\n🔗 https://www.planet-wissen.de/gesellschaft/mode/schuluniform/\n🔗 https://www.bpb.de/themen/bildung/",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "worksheet", "title": "Arbeitsblatt: Argumente ordnen", "icon": "file-text", "color": "#4527A0",
                     "description": "Ordne die gesammelten Argumente nach **Stärke** (schwächstes → stärkstes). Schreibe zu jedem Argument ein **Beispiel** oder einen **Beleg**.",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Partnerkorrektur"},
                    {"type": "creative", "title": "Erörterung verfassen", "icon": "edit-3", "color": "#C62828",
                     "description": "Verfasse eine **dialektische Erörterung** (mind. 400 Wörter) zum Thema:\n\n> *Sollten Handys im Unterricht erlaubt sein?*\n\nAchte auf Einleitung, Hauptteil (Pro/Contra) und Schluss mit eigener Stellungnahme.",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "selftest", "title": "Selbsttest: Argumentationstypen", "icon": "check-square", "color": "#2E7D32",
                     "description": "Überprüfe dein Wissen zu den Argumentationstypen.\n\n🔗 https://learningapps.org/\n\nErstelle anschließend eine **Mindmap** mit den verschiedenen Argumenttypen (Fakten-, Autoritäts-, Normatives Argument, etc.).",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"}
                ]
            },
            {
                "name": "Kurzgeschichten analysieren",
                "ref": "01.02",
                "description": """## Lernziele

- Du kennst die **Merkmale** einer Kurzgeschichte.
- Du kannst **Erzählperspektive** und **Sprachliche Mittel** bestimmen.
- Du schreibst eine strukturierte **Textanalyse**.
- Du vergleichst Kurzgeschichten **thematisch**.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Merkmale der Kurzgeschichte", "icon": "play-circle", "color": "#1565C0",
                     "description": "Sieh dir das Video an und erstelle eine **Checkliste** mit den typischen Merkmalen.\n\n🔗 https://www.youtube.com/watch?v=Z3WKBKqnHtQ",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "book", "title": "Lesen: 'Das Brot' von W. Borchert", "icon": "book-open", "color": "#1565C0",
                     "description": "Lies die Kurzgeschichte **'Das Brot'** von Wolfgang Borchert aufmerksam durch. Markiere:\n- 🟡 Ungewöhnliche Formulierungen\n- 🔵 Wendepunkte\n- 🔴 Das offene Ende\n\n🔗 https://www.projekt-gutenberg.org/borchert/",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "worksheet", "title": "Analyse-Leitfaden anwenden", "icon": "file-text", "color": "#4527A0",
                     "description": "Analysiere **'Das Brot'** anhand des Leitfadens:\n\n1. **Inhalt** zusammenfassen (5 Sätze)\n2. **Erzählperspektive** bestimmen\n3. **3 sprachliche Mittel** benennen und deren Wirkung erklären\n4. **Deutungshypothese** formulieren",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "collection", "title": "Kurzgeschichten-Sammlung vergleichen", "icon": "grid", "color": "#00838F",
                     "description": "Wähle **eine weitere Kurzgeschichte** aus der Nachkriegsliteratur und vergleiche sie mit 'Das Brot':\n- Gemeinsamkeiten im **Thema**\n- Unterschiede in der **Erzähltechnik**\n\n🔗 https://www.deutschunddeutlich.de/contentLD/GD/GT74Kurzgeschichten.pdf",
                     "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "creative", "title": "Eigene Kurzgeschichte schreiben", "icon": "edit-3", "color": "#C62828",
                     "description": "Schreibe eine **eigene Kurzgeschichte** (200-400 Wörter). Beachte:\n- Unvermittelter Anfang\n- Alltägliche Situation mit Wendepunkt\n- Offenes Ende\n- Mindestens **2 sprachliche Mittel** bewusst einsetzen",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"}
                ]
            },
            {
                "name": "Medien kritisch nutzen",
                "ref": "01.03",
                "description": """## Lernziele

- Du erkennst **Fake News** und kannst sie von seriösen Nachrichten unterscheiden.
- Du kennst die Methoden der **Meinungsmanipulation** in sozialen Medien.
- Du kannst eine **Quellenanalyse** durchführen.
- Du reflektierst dein eigenes **Medienverhalten**.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Fake News erkennen", "icon": "play-circle", "color": "#1565C0",
                     "description": "Sieh dir das Video des SWR an und notiere die **5 Prüfschritte** gegen Fake News.\n\n🔗 https://www.youtube.com/watch?v=Vr4KxpEVuBo",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "weblink", "title": "Faktencheck-Training", "icon": "globe", "color": "#00838F",
                     "description": "Besuche die Seiten der Faktenchecker und prüfe **3 aktuelle Behauptungen**:\n\n🔗 https://correctiv.org/faktencheck/\n🔗 https://www.mimikama.org/\n\nDokumentiere für jede Behauptung: Quelle, Behauptung, Ergebnis des Checks.",
                     "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Partnerkorrektur"},
                    {"type": "digital", "title": "Medientagebuch führen", "icon": "monitor", "color": "#4527A0",
                     "description": "Führe **3 Tage lang** ein Medientagebuch:\n- Welche Medien nutzt du wann und wie lange?\n- Welche Informationen nimmst du auf?\n- Wie überprüfst du deren Wahrheitsgehalt?\n\nErstelle eine **Tabelle** mit deinen Ergebnissen.",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "survey", "title": "Umfrage: Mediennutzung der Klasse", "icon": "help-circle", "color": "#2E7D32",
                     "description": "Erstelle einen kurzen **Fragebogen** (5-8 Fragen) zur Mediennutzung. Befrage mindestens **10 Mitschüler** und werte die Ergebnisse in einem **Diagramm** aus.\n\n*Interdisziplinär: Nutze dein Wissen aus Mathematik (Statistik/Diagramme).*",
                     "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "creative", "title": "Infografik erstellen", "icon": "edit-3", "color": "#C62828",
                     "description": "Erstelle eine **Infografik** (z.B. mit Canva) zum Thema *\"So erkennst du Fake News\"*. Die Grafik soll:\n- Mindestens **5 Tipps** enthalten\n- Visuell ansprechend sein\n- In der Schule aushängbar sein\n\n🔗 https://www.canva.com/",
                     "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
                ]
            },
            {
                "name": "Bewerbung und Lebenslauf",
                "ref": "01.04",
                "description": """## Lernziele

- Du kennst den **Aufbau** eines Bewerbungsschreibens.
- Du kannst einen tabellarischen **Lebenslauf** erstellen.
- Du formulierst **individuell und überzeugend**.
- Du bereitest dich auf ein **Vorstellungsgespräch** vor.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Bewerbung schreiben", "icon": "play-circle", "color": "#1565C0",
                     "description": "Sieh dir das Video an und notiere die **DOs und DON'Ts** einer Bewerbung.\n\n🔗 https://www.youtube.com/watch?v=AKmHqrW1gKs",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "weblink", "title": "Stellenanzeigen analysieren", "icon": "globe", "color": "#00838F",
                     "description": "Suche auf einer Jobbörse **2 Ausbildungsangebote**, die dich interessieren. Markiere in der Anzeige:\n- Geforderte **Qualifikationen**\n- Erwünschte **Soft Skills**\n- **Aufgabenbeschreibung**\n\n🔗 https://www.ausbildung.de/\n🔗 https://www.ihk-lehrstellenboerse.de/",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "creative", "title": "Bewerbungsschreiben verfassen", "icon": "edit-3", "color": "#C62828",
                     "description": "Verfasse ein **vollständiges Bewerbungsschreiben** für eine der recherchierten Stellen. Achte auf:\n- Korrekten **Briefkopf**\n- Bezug zur **Stellenanzeige**\n- Deine **Stärken** mit Beispielen belegen\n- Fehlerfreie Rechtschreibung",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "40 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "worksheet", "title": "Tabellarischer Lebenslauf", "icon": "file-text", "color": "#4527A0",
                     "description": "Erstelle deinen **tabellarischen Lebenslauf** nach aktuellem Standard:\n- Persönliche Daten\n- Schulbildung\n- Praktika / Nebenjobs\n- Kenntnisse und Interessen\n\n*Interdisziplinär: Nutze dein Wissen aus Informatik (Textverarbeitung, Layout).*",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "learningapp", "title": "Rollenspiel: Vorstellungsgespräch", "icon": "cpu", "color": "#2E7D32",
                     "description": "Übt zu zweit ein **Vorstellungsgespräch**. Wechselt die Rollen (Bewerber/Personaler). Achtet auf:\n- Begrüßung und Körpersprache\n- Typische Fragen beantworten\n- Eigene Fragen stellen\n\nGebt euch gegenseitig **Feedback** mit dem Feedbackbogen.",
                     "socialForm": "Partnerarbeit", "submissionForm": "mündlich", "effort": "30 Minuten", "correctionForm": "Partnerkorrektur"}
                ]
            }
        ]
    },
    {
        "name": "Mathematik",
        "color": "#2E7D32",
        "ref": "02",
        "note": "Algebra, Geometrie, Funktionen, Stochastik",
        "topics": [
            {
                "name": "Lineare Funktionen",
                "ref": "02.01",
                "description": """## Lernziele

- Du kannst lineare Funktionen **zeichnen** und ihre **Gleichung** aufstellen.
- Du bestimmst **Steigung** und **y-Achsenabschnitt**.
- Du löst **Anwendungsaufgaben** mit linearen Funktionen.
- Du erkennst **Parallelen und Schnittpunkte**.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Lineare Funktionen", "icon": "play-circle", "color": "#1565C0",
                     "description": "Schau dir das Video zu linearen Funktionen an. Notiere die Formel **y = mx + b** und erkläre die Bedeutung von **m** und **b**.\n\n🔗 https://www.youtube.com/watch?v=3iswSgU1n7o",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "learningapp", "title": "GeoGebra: Funktionen erkunden", "icon": "cpu", "color": "#2E7D32",
                     "description": "Öffne GeoGebra und experimentiere:\n- Verändere **m** (Steigung): Was passiert?\n- Verändere **b** (y-Achsenabschnitt): Was passiert?\n- Wann sind zwei Geraden **parallel**?\n\n🔗 https://www.geogebra.org/graphing\n\n*Interdisziplinär: In Physik nutzt du lineare Funktionen für Weg-Zeit-Diagramme.*",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "worksheet", "title": "Übungsaufgaben: Geraden zeichnen", "icon": "file-text", "color": "#4527A0",
                     "description": "Bearbeite die folgenden Aufgaben:\n\n1. Zeichne die Geraden y=2x+1, y=-x+3, y=0.5x-2\n2. Bestimme die Gleichung der Geraden durch P(1|3) und Q(4|9)\n3. Berechne den Schnittpunkt von y=2x+1 und y=-x+4\n4. Welche Geraden sind parallel zueinander?\n\n📏 Nutze Karopapier!",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "30 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "digital", "title": "Anwendung: Handytarife vergleichen", "icon": "monitor", "color": "#4527A0",
                     "description": "Vergleiche **3 Handytarife** als lineare Funktionen:\n- Tarif A: 5€ Grundgebühr + 0,10€/min\n- Tarif B: 10€ Grundgebühr + 0,05€/min\n- Tarif C: Flatrate 15€\n\n1. Stelle die **Kostenfunktionen** auf\n2. Zeichne alle drei in **ein Koordinatensystem**\n3. Ab welcher Minutenzahl lohnt sich welcher Tarif?",
                     "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "selftest", "title": "Selbsttest: Lineare Funktionen", "icon": "check-square", "color": "#2E7D32",
                     "description": "Teste dein Wissen mit dem Online-Quiz.\n\n🔗 https://matheaufgaben.net/\n🔗 https://www.schlaukopf.de/\n\nNotiere, welche Aufgabentypen dir noch **schwerfallen** und übe diese gezielt nach.",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"}
                ]
            },
            {
                "name": "Prozent- und Zinsrechnung",
                "ref": "02.02",
                "description": """## Lernziele

- Du berechnest **Prozentwert**, **Grundwert** und **Prozentsatz**.
- Du wendest **Zinsrechnung** auf Alltagsbeispiele an.
- Du verstehst den **Zinseszins-Effekt**.
- Du vergleichst **Finanzangebote** kritisch.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Prozentrechnung", "icon": "play-circle", "color": "#1565C0",
                     "description": "Schau das Video und löse die eingeblendeten Aufgaben mit.\n\n🔗 https://www.youtube.com/watch?v=rNH8iRkFzlY\n\nNotiere das **Dreisatz-Schema** für Prozentrechnung.",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "weblink", "title": "Recherche: Zinsen im Alltag", "icon": "globe", "color": "#00838F",
                     "description": "Recherchiere aktuelle **Zinssätze**:\n- Tagesgeldkonto\n- Sparbuch\n- Ratenkredit\n- Dispokredit\n\n🔗 https://www.finanztip.de/\n🔗 https://www.verbraucherzentrale.de/\n\n*Interdisziplinär: Verbindung zu Wirtschaft/Politik — Warum ändert die EZB den Leitzins?*",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "worksheet", "title": "Alltagsaufgaben Prozente", "icon": "file-text", "color": "#4527A0",
                     "description": "Berechne:\n1. Ein Smartphone kostet 599€. Es gibt **15% Rabatt**. Wie viel zahlst du?\n2. Du hast 1.200€ auf dem Konto, Zinssatz **1,5% p.a.** Wie viel Zinsen nach 1 Jahr?\n3. Nach 3 Jahren mit **Zinseszins** — wie viel hast du dann?\n4. Ein Kredit über 5.000€ mit **8% Zinsen** — monatliche Rate bei 2 Jahren Laufzeit?",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "digital", "title": "Tabellenkalkulation: Zinseszins", "icon": "monitor", "color": "#4527A0",
                     "description": "Erstelle eine **Tabelle** (LibreOffice Calc oder Excel), die den Zinseszins über **10 Jahre** berechnet. Variiere:\n- Startkapital: 500€, 1.000€, 5.000€\n- Zinssatz: 1%, 3%, 5%\n\nErstelle ein **Diagramm** das den Zinseszins-Effekt visualisiert.",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "learningapp", "title": "Quiz: Prozente im Kopf", "icon": "cpu", "color": "#2E7D32",
                     "description": "Trainiere **Kopfrechnen** mit Prozenten:\n- 10% von 250?\n- 25% von 80?\n- 33% von 120?\n\n🔗 https://learningapps.org/\n🔗 https://www.schlaukopf.de/\n\nZiel: Mindestens **8 von 10** richtig!",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
                ]
            },
            {
                "name": "Satz des Pythagoras",
                "ref": "02.03",
                "description": """## Lernziele

- Du kennst den **Satz des Pythagoras** und kannst ihn anwenden.
- Du berechnest **fehlende Seiten** im rechtwinkligen Dreieck.
- Du erkennst **pythagoräische Zahlentripel**.
- Du löst **Anwendungsaufgaben** in der Realität.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Satz des Pythagoras", "icon": "play-circle", "color": "#1565C0",
                     "description": "Sieh dir die Herleitung des Satzes an und notiere die Formel **a² + b² = c²**.\n\n🔗 https://www.youtube.com/watch?v=uaj0XcLIzp4\n\nZeichne ein Beispieldreieck mit a=3, b=4. Berechne c.",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "learningapp", "title": "GeoGebra: Pythagoras interaktiv", "icon": "cpu", "color": "#2E7D32",
                     "description": "Erkunde den Satz des Pythagoras visuell in GeoGebra.\n\n🔗 https://www.geogebra.org/m/MEpWWbgJ\n\nVerschiebe die Eckpunkte und beobachte, wie sich die Quadrate über den Seiten ändern.\n\n*Interdisziplinär: In Physik nutzt du Pythagoras bei der Kräftezerlegung.*",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "worksheet", "title": "Übungsaufgaben: Seitenlängen berechnen", "icon": "file-text", "color": "#4527A0",
                     "description": "Berechne die fehlende Seite:\n1. a=5, b=12, c=?\n2. a=?, b=8, c=17\n3. a=7, b=?, c=25\n4. Ist ein Dreieck mit a=6, b=8, c=10 rechtwinklig?\n5. Eine Leiter (5m) lehnt an einer Wand. Fuß ist 3m von der Wand entfernt. Wie hoch reicht sie?",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "weblink", "title": "Geschichte des Pythagoras", "icon": "globe", "color": "#00838F",
                     "description": "Recherchiere über den Mathematiker **Pythagoras** und seine Schule.\n\n🔗 https://de.wikipedia.org/wiki/Pythagoras\n🔗 https://www.planet-wissen.de/\n\nWar Pythagoras wirklich der Entdecker? Wer kannte den Satz schon vorher?\n\n*Interdisziplinär: Verbindung zu Geschichte — antike Mathematik.*",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "creative", "title": "Pythagoras in der Praxis messen", "icon": "edit-3", "color": "#C62828",
                     "description": "Miss in der Schule oder zu Hause **3 rechtwinklige Situationen** aus:\n- Türrahmen (Diagonale)\n- Tischplatte (Diagonale)\n- Fenster\n\nÜberprüfe jeweils mit dem Satz des Pythagoras, ob der rechte Winkel **exakt** ist.",
                     "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
                ]
            },
            {
                "name": "Wahrscheinlichkeitsrechnung",
                "ref": "02.04",
                "description": """## Lernziele

- Du kennst den Unterschied zwischen **Laplace-Experiment** und allgemeinem Zufallsexperiment.
- Du berechnest **Wahrscheinlichkeiten** mit Baumdiagrammen.
- Du wendest die **Pfadregeln** an.
- Du interpretierst **statistische Daten** aus dem Alltag.""",
                "tasks": [
                    {"type": "video", "title": "Erklärvideo: Baumdiagramme", "icon": "play-circle", "color": "#1565C0",
                     "description": "Lerne, wie man Baumdiagramme zeichnet und die Pfadregeln anwendet.\n\n🔗 https://www.youtube.com/watch?v=qOBMaA4R3Vs\n\nZeichne das Baumdiagramm für **zweimaliges Würfeln** (nur 1-3 und 4-6).",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "digital", "title": "Simulation: Münzwurf 1000x", "icon": "monitor", "color": "#4527A0",
                     "description": "Nutze einen Online-Simulator und wirf eine Münze **1000 Mal**. Dokumentiere:\n- Ergebnis nach 10, 100, 1000 Würfen\n- Wie nähert sich die relative Häufigkeit der **theoretischen Wahrscheinlichkeit**?\n\n🔗 https://www.random.org/coins/\n\n*Interdisziplinär: In Biologie nutzt du Wahrscheinlichkeit bei der Vererbung (Mendel).*",
                     "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "worksheet", "title": "Aufgaben: Mehrstufige Experimente", "icon": "file-text", "color": "#4527A0",
                     "description": "Berechne mit Baumdiagramm:\n1. Urne mit 3 roten, 2 blauen Kugeln. Zweimal ziehen **mit** Zurücklegen: P(2x rot)?\n2. Gleiche Urne, **ohne** Zurücklegen: P(2x rot)?\n3. Zwei Würfel: P(Summe = 7)?\n4. Lottoziehung: P(6 Richtige aus 49)?",
                     "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "30 Minuten", "correctionForm": "Selbstkorrektur"},
                    {"type": "survey", "title": "Statistik-Projekt: Klassen-Umfrage", "icon": "help-circle", "color": "#2E7D32",
                     "description": "Führe eine **Umfrage** in der Klasse durch (z.B. Lieblingsfarbe, Schuhgröße, Schulweg-Dauer). Erstelle:\n- **Häufigkeitstabelle**\n- **Säulendiagramm**\n- Berechne **Mittelwert** und **Median**\n\n*Interdisziplinär: Nutze Tabellenkalkulation (Informatik) für die Auswertung.*",
                     "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"},
                    {"type": "selftest", "title": "Quiz: Wahrscheinlichkeit", "icon": "check-square", "color": "#2E7D32",
                     "description": "Teste dein Wissen:\n\n🔗 https://www.schlaukopf.de/\n🔗 https://matheaufgaben.net/\n\nZiel: Mindestens **80%** richtig. Wiederhole Themen, die dir schwerfallen.",
                     "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
                ]
            }
        ]
    },
    {
        "name": "Englisch",
        "color": "#1565C0",
        "ref": "03",
        "note": "Reading, Writing, Listening, Speaking",
        "topics": [
            {"name": "Reading Comprehension Strategies", "ref": "03.01",
             "description": "## Learning Goals\n\n- You can apply **skimming** and **scanning** techniques.\n- You understand **main ideas** and **supporting details**.\n- You can **infer meaning** from context.\n- You summarise texts in your **own words**.",
             "tasks": [
                 {"type": "video", "title": "Video: Reading Strategies", "icon": "play-circle", "color": "#1565C0",
                  "description": "Watch the video about effective reading strategies and take notes on the **SQ3R method**.\n\n🔗 https://www.youtube.com/watch?v=LFDUBXQaahs",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Read: News Article (B1-B2)", "icon": "globe", "color": "#00838F",
                  "description": "Choose an article from an English news site for learners:\n\n🔗 https://www.newsinlevels.com/\n🔗 https://breakingnewsenglish.com/\n\n1. Read the article **twice** (skimming → detailed)\n2. Write a **summary** in 5 sentences\n3. List **5 new vocabulary words** with definitions",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Comprehension Questions", "icon": "file-text", "color": "#4527A0",
                  "description": "Answer the following about your chosen article:\n1. What is the **main idea**?\n2. Name **3 supporting details**.\n3. What is the author's **opinion**? How do you know?\n4. Do you **agree**? Why / why not? (min. 50 words)",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "learningapp", "title": "Vocabulary Trainer", "icon": "cpu", "color": "#2E7D32",
                  "description": "Practice the new vocabulary from your article using Quizlet:\n\n🔗 https://quizlet.com/\n\nCreate a set with your **5 words** + definitions + example sentences. Practice until you score **100%**.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Book Review", "icon": "edit-3", "color": "#C62828",
                  "description": "Write a **book review** (150-200 words) about a book or story you've read in English. Include:\n- Title and author\n- Brief **plot summary** (no spoilers!)\n- Your **opinion** and **recommendation**\n- Rating: ⭐ to ⭐⭐⭐⭐⭐\n\n*Interdisciplinary: Connect to German — compare review styles in both languages.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Writing: Emails and Letters", "ref": "03.02",
             "description": "## Learning Goals\n\n- You can write **formal** and **informal emails**.\n- You know the correct **format** and **salutations**.\n- You use **linking words** to structure your text.\n- You can write a **letter of complaint**.",
             "tasks": [
                 {"type": "video", "title": "Video: Formal vs Informal Emails", "icon": "play-circle", "color": "#1565C0",
                  "description": "Watch the video and create a **comparison table**: formal vs informal language.\n\n🔗 https://www.youtube.com/watch?v=Kf_yzIJBiVc",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Useful Phrases Collection", "icon": "file-text", "color": "#4527A0",
                  "description": "Create a **phrase bank** for emails:\n\n| Situation | Formal | Informal |\n|-----------|--------|----------|\n| Opening | Dear Sir/Madam | Hi/Hey |\n| Purpose | I am writing to... | Just wanted to... |\n| Closing | Yours faithfully | Cheers / Best |\n\nAdd at least **10 phrase pairs**.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Write: Informal Email to Pen Pal", "icon": "edit-3", "color": "#C62828",
                  "description": "Write an **informal email** (120-150 words) to an imaginary pen pal in England. Tell them about:\n- Your school and daily routine\n- Your hobbies\n- Ask **3 questions** about their life",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Write: Formal Complaint Letter", "icon": "edit-3", "color": "#C62828",
                  "description": "Write a **formal letter of complaint** (150-200 words) to a company. Scenario: You ordered a product online that arrived damaged.\n\nInclude:\n- Formal greeting and closing\n- Description of the **problem**\n- What **action** you expect\n\n*Interdisciplinary: Compare with German business letter format (Deutsch).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "learningapp", "title": "Peer Review: Exchange Emails", "icon": "cpu", "color": "#2E7D32",
                  "description": "Exchange your email with a **partner** and check for:\n- ✅ Correct format?\n- ✅ Appropriate register (formal/informal)?\n- ✅ Grammar and spelling?\n- ✅ Clear structure?\n\nGive **written feedback** with at least 2 positives and 2 suggestions.",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Partnerkorrektur"}
             ]},
            {"name": "Listening: Everyday Conversations", "ref": "03.03",
             "description": "## Learning Goals\n\n- You understand **native speakers** at normal speed.\n- You can identify **key information** in conversations.\n- You understand **different accents** (British, American).\n- You improve your own **pronunciation**.",
             "tasks": [
                 {"type": "video", "title": "Listening: TED-Ed Video", "icon": "play-circle", "color": "#1565C0",
                  "description": "Watch a TED-Ed video (with English subtitles first, then without):\n\n🔗 https://ed.ted.com/\n\nChoose a topic that interests you. Answer:\n1. What is the **main message**?\n2. Name **3 facts** you learned.\n3. What was **difficult to understand**?",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Podcast: 6 Minute English (BBC)", "icon": "globe", "color": "#00838F",
                  "description": "Listen to one episode of BBC 6 Minute English:\n\n🔗 https://www.bbc.co.uk/learningenglish/english/features/6-minute-english\n\n1. Listen **twice**\n2. Complete the **quiz** on the website\n3. Write down **5 new expressions**",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "digital", "title": "Dictation Practice", "icon": "monitor", "color": "#4527A0",
                  "description": "Practice dictation with an online tool:\n\n🔗 https://dictation.io/\n🔗 https://www.esl-lab.com/\n\nDo **3 dictation exercises** at your level. Check your accuracy.\n\n*Interdisciplinary: Use techniques from German Diktat practice.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Create a Dialogue", "icon": "edit-3", "color": "#C62828",
                  "description": "Write and **record** a dialogue (2-3 minutes) with a partner. Scenarios:\n- Ordering food at a restaurant\n- Asking for directions\n- Job interview\n\nUse a voice recorder or smartphone. Focus on **pronunciation** and **intonation**.",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Listening Comprehension Test", "icon": "check-square", "color": "#2E7D32",
                  "description": "Take a listening test at your level:\n\n🔗 https://www.examenglish.com/PET/pet_listening.htm\n🔗 https://learnenglish.britishcouncil.org/skills/listening\n\nTarget: **70% or higher**. Note areas where you need more practice.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Cultural Studies: UK & USA", "ref": "03.04",
             "description": "## Learning Goals\n\n- You know key facts about the **UK** and **USA**.\n- You can compare **school systems** in both countries.\n- You understand **cultural differences**.\n- You present your findings in a **short talk**.",
             "tasks": [
                 {"type": "video", "title": "Video: School in the USA vs UK", "icon": "play-circle", "color": "#1565C0",
                  "description": "Watch the video comparing school systems and create a **Venn diagram** (similarities and differences).\n\n🔗 https://www.youtube.com/watch?v=dqTRUHdHnPw",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Research: Landmarks & Culture", "icon": "globe", "color": "#00838F",
                  "description": "Research **one US state** OR **one UK region**. Find out about:\n- Famous **landmarks**\n- Local **traditions**\n- Typical **food**\n\n🔗 https://www.visitbritain.com/\n🔗 https://www.nps.gov/\n\n*Interdisciplinary: Connect to Geography — locate your region on a map.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Create a Travel Poster", "icon": "edit-3", "color": "#C62828",
                  "description": "Design a **travel poster** (A4) for your researched region. Include:\n- Attractive **headline** in English\n- Key **facts** and **images**\n- A **slogan** that makes people want to visit\n\n🔗 https://www.canva.com/",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "book", "title": "Read: Cultural Comparison Text", "icon": "book-open", "color": "#1565C0",
                  "description": "Read the text about cultural differences between Germany and English-speaking countries.\n\n🔗 https://learnenglish.britishcouncil.org/general-english/magazine\n\nList **5 surprising differences** you didn't know about.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Presentation: My Region", "icon": "cpu", "color": "#2E7D32",
                  "description": "Prepare a **2-minute presentation** about your researched region. Use:\n- **Note cards** (not full sentences!)\n- At least **3 visual aids**\n- Speak **freely** — don't read!\n\nPresent to your group and get **peer feedback**.",
                  "socialForm": "Gruppenarbeit", "submissionForm": "mündlich", "effort": "30 Minuten", "correctionForm": "Partnerkorrektur"}
             ]}
        ]
    },
    {
        "name": "Physik",
        "color": "#E65100",
        "ref": "04",
        "note": "Mechanik, Elektrizität, Optik, Energie",
        "topics": [
            {"name": "Kräfte und Bewegung", "ref": "04.01",
             "description": "## Lernziele\n\n- Du kennst die **Newton'schen Gesetze**.\n- Du berechnest Kräfte mit **F = m · a**.\n- Du zeichnest **Kräftediagramme**.\n- Du erklärst **Trägheit** und **Reibung** im Alltag.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Newton'sche Gesetze", "icon": "play-circle", "color": "#1565C0",
                  "description": "Schau dir die 3 Newton'schen Gesetze an und formuliere jedes in **eigenen Worten**.\n\n🔗 https://www.youtube.com/watch?v=kKKM8Y-u7ds",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Simulation: Kräfte erkunden", "icon": "cpu", "color": "#2E7D32",
                  "description": "Experimentiere mit der PhET-Simulation:\n\n🔗 https://phet.colorado.edu/de/simulations/forces-and-motion-basics\n\nVariiere Masse und Kraft. Was passiert bei Reibung?\n\n*Interdisziplinär: Nutze Mathe (lineare Funktionen) für F-a-Diagramme.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Rechenaufgaben: F = m · a", "icon": "file-text", "color": "#4527A0",
                  "description": "Berechne:\n1. F = ?, m = 5 kg, a = 3 m/s²\n2. F = 20 N, m = ?, a = 4 m/s²\n3. F = 100 N, m = 25 kg, a = ?\n4. Ein Auto (1200 kg) beschleunigt mit 2 m/s². Welche Kraft wirkt?\n5. Gewichtskraft einer Person (70 kg) auf dem Mond (g = 1,6 m/s²)?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Experiment: Trägheit demonstrieren", "icon": "edit-3", "color": "#C62828",
                  "description": "Führe **2 Trägheitsexperimente** zu Hause durch:\n1. Münze vom Kartenrand schnipsen\n2. Tischdecke schnell wegziehen\n\n**Dokumentiere** mit Fotos/Video und erkläre physikalisch, warum es funktioniert.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "weblink", "title": "Recherche: Kräfte im Sport", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere, wie Kräfte in **einer Sportart** wirken (z.B. Fußball, Schwimmen, Weitsprung).\n\n🔗 https://www.leifiphysik.de/mechanik/kraft-und-masse\n\nErkläre mit Newton's Gesetzen, warum bestimmte Techniken funktionieren.\n\n*Interdisziplinär: Verbindung zu Sport — Biomechanik.*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Elektrische Schaltungen", "ref": "04.02",
             "description": "## Lernziele\n\n- Du kennst **Reihen-** und **Parallelschaltung**.\n- Du misst **Spannung**, **Stromstärke** und **Widerstand**.\n- Du berechnest mit dem **Ohm'schen Gesetz** U = R · I.\n- Du baust einfache **Schaltungen** auf.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Ohm'sches Gesetz", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne U = R · I und die Unterschiede Reihen-/Parallelschaltung.\n\n🔗 https://www.youtube.com/watch?v=HUgYpl4M4JY",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Simulation: Schaltungen bauen", "icon": "cpu", "color": "#2E7D32",
                  "description": "Baue virtuelle Schaltungen mit PhET:\n\n🔗 https://phet.colorado.edu/de/simulations/circuit-construction-kit-dc\n\n1. Baue eine **Reihenschaltung** mit 2 Widerständen\n2. Miss U und I an verschiedenen Stellen\n3. Baue die gleiche als **Parallelschaltung** — was ändert sich?",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Rechenaufgaben: U = R · I", "icon": "file-text", "color": "#4527A0",
                  "description": "Berechne:\n1. U = 12V, R = 4Ω → I = ?\n2. U = ?, R = 100Ω, I = 0,5A\n3. Reihenschaltung: R1=10Ω, R2=20Ω, U=9V → I = ?\n4. Parallelschaltung: R1=10Ω, R2=10Ω → Rges = ?\n5. Welche **Leistung** verbraucht eine Lampe mit U=230V und I=0,5A?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Stromverbrauch zu Hause", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere den Stromverbrauch von **5 Geräten** in deinem Haushalt:\n\n🔗 https://www.stromspiegel.de/\n\nBerechne die **jährlichen Kosten** bei 0,35€/kWh.\n\n*Interdisziplinär: Verbindung zu Geographie (Energiequellen) und Mathe (Prozentrechnung).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Quiz: Elektrizitätslehre", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen:\n\n🔗 https://www.leifiphysik.de/elektrizitaetslehre/\n🔗 https://www.schlaukopf.de/\n\nZiel: Alle Grundlagen sicher beherrschen.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Optik: Licht und Farben", "ref": "04.03",
             "description": "## Lernziele\n\n- Du kennst **Reflexion** und **Brechung** des Lichts.\n- Du erklärst die **Farbzerlegung** (Spektrum).\n- Du verstehst die Funktion von **Linsen**.\n- Du erklärst, wie das **Auge** funktioniert.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Lichtbrechung", "icon": "play-circle", "color": "#1565C0",
                  "description": "Sieh dir die Erklärung zur Brechung an und zeichne den **Strahlengang** bei Übergang Luft→Glas.\n\n🔗 https://www.youtube.com/watch?v=y55tzg_jW9I",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Simulation: Lichtbrechung", "icon": "cpu", "color": "#2E7D32",
                  "description": "Experimentiere mit der PhET-Simulation:\n\n🔗 https://phet.colorado.edu/de/simulations/bending-light\n\nWas passiert bei verschiedenen Materialien? Wann tritt **Totalreflexion** auf?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Experiment: Regenbogen erzeugen", "icon": "edit-3", "color": "#C62828",
                  "description": "Erzeuge mit einem **Prisma** oder einer **CD** und einer Taschenlampe ein Spektrum.\n\nAlternativ: Wasserglas + weißes Papier + Sonnenlicht.\n\nFotografiere dein Ergebnis und benenne die **Spektralfarben** in der richtigen Reihenfolge.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "weblink", "title": "Recherche: Wie funktioniert das Auge?", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere den Aufbau des menschlichen Auges und erkläre:\n- Wie entsteht ein **Bild** auf der Netzhaut?\n- Was passiert bei **Kurz-/Weitsichtigkeit**?\n- Wie korrigieren **Brillen** den Fehler?\n\n🔗 https://www.planet-wissen.de/natur/sinne/sehen/\n\n*Interdisziplinär: Verbindung zu Biologie (Sinnesorgane).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Aufgaben: Linsen und Abbildungen", "icon": "file-text", "color": "#4527A0",
                  "description": "Zeichne den Strahlengang für:\n1. Sammellinse — Gegenstand **außerhalb** der doppelten Brennweite\n2. Sammellinse — Gegenstand **innerhalb** der Brennweite (Lupe)\n3. Zerstreuungslinse\n\nBeschrifte: Brennpunkt, Brennweite, Bild (reell/virtuell).",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Energie und Klimawandel", "ref": "04.04",
             "description": "## Lernziele\n\n- Du kennst verschiedene **Energieformen** und **Energieumwandlungen**.\n- Du verstehst den **Energieerhaltungssatz**.\n- Du erklärst den **Treibhauseffekt** physikalisch.\n- Du bewertest **erneuerbare Energien** kritisch.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Treibhauseffekt", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe den physikalischen Hintergrund des Treibhauseffekts.\n\n🔗 https://www.youtube.com/watch?v=SN5-DnOHQmE\n\nErkläre den Unterschied zwischen **natürlichem** und **anthropogenem** Treibhauseffekt.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Erneuerbare Energien", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere **3 erneuerbare Energiequellen** (Solar, Wind, Wasser):\n- Wie funktionieren sie physikalisch?\n- Vor- und Nachteile?\n- Anteil am deutschen Strommix?\n\n🔗 https://www.umweltbundesamt.de/themen/klima-energie/erneuerbare-energien\n🔗 https://www.energy-charts.info/\n\n*Interdisziplinär: Verbindung zu Geographie (Standortfaktoren) und Politik (Energiewende).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "digital", "title": "CO₂-Fußabdruck berechnen", "icon": "monitor", "color": "#4527A0",
                  "description": "Berechne deinen persönlichen **CO₂-Fußabdruck**:\n\n🔗 https://uba.co2-rechner.de/\n\nVergleiche mit dem **deutschen Durchschnitt** und dem **Klimaziel**. Wo kannst du am meisten einsparen?",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Energieumwandlungsketten", "icon": "file-text", "color": "#4527A0",
                  "description": "Zeichne die Energieumwandlungskette für:\n1. Kohlekraftwerk\n2. Solarzelle\n3. Windkraftanlage\n4. Wasserkraftwerk\n5. Fahrradfahrer\n\nBenenne bei jeder Umwandlung die **Verluste** (Abwärme etc.).",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Plakat: Energiewende unserer Stadt", "icon": "edit-3", "color": "#C62828",
                  "description": "Erstellt in der Gruppe ein **Plakat** mit einem Energiekonzept für eure Stadt:\n- Welche erneuerbaren Energien eignen sich am Standort?\n- Wie viel Energie wird benötigt?\n- Welche Maßnahmen zum Energiesparen?\n\nPräsentiert euer Konzept der Klasse.",
                  "socialForm": "Gruppenarbeit", "submissionForm": "mündlich", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]}
        ]
    },
    {
        "name": "Biologie",
        "color": "#388E3C",
        "ref": "05",
        "note": "Ökologie, Genetik, Evolution, Mensch",
        "topics": [
            {"name": "Ökosystem Wald", "ref": "05.01",
             "description": "## Lernziele\n\n- Du kennst die **Stockwerke** des Waldes.\n- Du erklärst **Nahrungsketten** und **Nahrungsnetze**.\n- Du verstehst den **Stoffkreislauf**.\n- Du bewertest **Eingriffe** des Menschen.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Ökosystem Wald", "icon": "play-circle", "color": "#1565C0",
                  "description": "Sieh dir das Video zum Ökosystem Wald an.\n\n🔗 https://www.youtube.com/watch?v=2Dup-_j0oIU\n\nZeichne die **5 Stockwerke** des Waldes und ordne je 2 Tier-/Pflanzenarten zu.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Waldsterben und Klimawandel", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere zum Zustand des deutschen Waldes:\n\n🔗 https://www.bmel.de/DE/themen/wald/wald-in-deutschland/waldzustandserhebung.html\n🔗 https://www.nabu.de/natur-und-landschaft/waelder/\n\nWie wirkt sich der Klimawandel auf den Wald aus?\n\n*Interdisziplinär: Verbindung zu Geographie (Klimazonen) und Physik (Treibhauseffekt).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Nahrungsnetz erstellen", "icon": "edit-3", "color": "#C62828",
                  "description": "Erstelle ein **Nahrungsnetz** des Waldes mit mindestens:\n- 3 **Produzenten**\n- 4 **Konsumenten** (verschiedene Ordnungen)\n- 2 **Destruenten**\n\nZeichne Pfeile (→ = wird gefressen von) und markiere die trophischen Ebenen farbig.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Stoffkreislauf im Wald", "icon": "file-text", "color": "#4527A0",
                  "description": "Beschreibe den **Kohlenstoffkreislauf** im Wald:\n1. Wie nehmen Pflanzen CO₂ auf? (Photosynthese)\n2. Wie wird C an Tiere weitergegeben?\n3. Wie gelangt C zurück in die Atmosphäre?\n4. Welche Rolle spielen Destruenten?\n\nZeichne ein **Kreislaufdiagramm**.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "survey", "title": "Exkursion: Waldstück untersuchen", "icon": "help-circle", "color": "#2E7D32",
                  "description": "Untersuche ein **Waldstück** (Schulgelände oder Umgebung):\n- Welche **Baumarten** findest du? (Bestimmungs-App nutzen)\n- Welche **Tiere/Spuren** entdeckst du?\n- Wie ist der **Boden** beschaffen?\n\n🔗 https://www.floraincognita.de/ (Pflanzen-Bestimmung)\n\nDokumentiere mit Fotos und erstelle einen **Steckbrief** deines Waldstücks.",
                  "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Genetik: Vererbung verstehen", "ref": "05.02",
             "description": "## Lernziele\n\n- Du kennst den Aufbau von **DNA** und **Chromosomen**.\n- Du kannst **Mendel'sche Regeln** anwenden.\n- Du erstellst **Kreuzungsschemata**.\n- Du diskutierst ethische Fragen der **Gentechnik**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: DNA und Gene", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne den Aufbau der DNA und die Bedeutung der Gene.\n\n🔗 https://www.youtube.com/watch?v=qQWfJ_yNBuM\n\nZeichne die **Doppelhelix** und beschrifte: Zucker, Phosphat, Basenpaare (A-T, G-C).",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Interaktiv: Mendel'sche Regeln", "icon": "cpu", "color": "#2E7D32",
                  "description": "Experimentiere mit virtuellen Kreuzungen:\n\n🔗 https://phet.colorado.edu/de/simulations/natural-selection\n\nKreuze Organismen und beobachte die Vererbung. Welche Regeln bestätigen sich?\n\n*Interdisziplinär: Nutze Mathe (Wahrscheinlichkeitsrechnung) für die Aufspaltungsverhältnisse.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Kreuzungsschemata erstellen", "icon": "file-text", "color": "#4527A0",
                  "description": "Erstelle Kreuzungsschemata:\n1. Erbsenfarbe: gelb (dominant) × grün (rezessiv) → F1? → F2?\n2. Blutgruppen: Mutter A (heterozygot) × Vater B (heterozygot) → Kinder?\n3. Rot-Grün-Blindheit (X-chromosomal): Trägerin × gesunder Mann → ?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "30 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Gentechnik – Pro & Contra", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere zu **einem** Gentechnik-Thema:\n- CRISPR/Cas9 Genschere\n- Genveränderte Lebensmittel\n- Gentherapie bei Erbkrankheiten\n\n🔗 https://www.planet-wissen.de/natur/forschung/gentechnik/\n\nSammle **je 3 Pro- und Contra-Argumente**.\n\n*Interdisziplinär: Verbindung zu Deutsch (Erörterung) und Ethik.*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Stammbaum-Analyse", "icon": "edit-3", "color": "#C62828",
                  "description": "Erstelle einen **fiktiven Familienstammbaum** über 3 Generationen für ein Merkmal (z.B. Ohrläppchen angelegt/frei).\n\nMarkiere:\n- ■ = Merkmalsträger\n- □ = kein Merkmal\n- Genotypen an jeder Person\n\nBestimme den **Erbgang** (dominant/rezessiv).",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Gesundheit und Immunsystem", "ref": "05.03",
             "description": "## Lernziele\n\n- Du kennst die **Bestandteile** des Immunsystems.\n- Du erklärst den Unterschied zwischen **Bakterien** und **Viren**.\n- Du verstehst, wie **Impfungen** wirken.\n- Du triffst informierte **Gesundheitsentscheidungen**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Immunsystem", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe die Abwehrmechanismen deines Körpers.\n\n🔗 https://www.youtube.com/watch?v=lXfEK8G8CUI (Kurzgesagt)\n\nErstelle eine **Übersicht**: unspezifische vs. spezifische Abwehr.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Wie wirken Impfungen?", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere die Funktionsweise von Impfungen:\n\n🔗 https://www.rki.de/DE/Content/Infekt/Impfen/impfen_node.html\n🔗 https://www.quarks.de/gesundheit/medizin/so-funktionieren-impfungen/\n\nErkläre: Lebendimpfstoff vs. Totimpfstoff vs. mRNA-Impfstoff.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Bakterien vs. Viren", "icon": "file-text", "color": "#4527A0",
                  "description": "Erstelle eine **Vergleichstabelle**:\n\n| Merkmal | Bakterien | Viren |\n|---------|-----------|-------|\n| Aufbau | | |\n| Größe | | |\n| Vermehrung | | |\n| Behandlung | | |\n| Beispiele | | |\n\nWarum wirken Antibiotika **nicht** gegen Viren?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "digital", "title": "Infografik: Hygiene-Tipps", "icon": "monitor", "color": "#4527A0",
                  "description": "Erstelle eine **Infografik** mit den wichtigsten Hygiene-Regeln zur Krankheitsprävention.\n\n🔗 https://www.canva.com/\n\nBeziehe ein: Händewaschen, Husten-Etikette, Impfschutz, Ernährung, Bewegung.\n\n*Interdisziplinär: Verbindung zu Kunst (Design) und Deutsch (Informationstext).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "survey", "title": "Umfrage: Gesundheitsverhalten", "icon": "help-circle", "color": "#2E7D32",
                  "description": "Erstelle einen Fragebogen zum **Gesundheitsverhalten** (Schlaf, Ernährung, Bewegung, Impfstatus).\n\nBefrage **10 Personen** und werte die Ergebnisse aus.\n\n*Interdisziplinär: Nutze Mathe (Statistik, Diagramme) für die Auswertung.*",
                  "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "40 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Evolution und Anpassung", "ref": "05.04",
             "description": "## Lernziele\n\n- Du kennst **Darwins Evolutionstheorie**.\n- Du erklärst **natürliche Selektion** und **Anpassung**.\n- Du deutest **Fossilien** als Belege für Evolution.\n- Du erklärst die **Entstehung neuer Arten**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Darwins Reise", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne Darwins Entdeckungen auf den Galápagos-Inseln kennen.\n\n🔗 https://www.youtube.com/watch?v=T8kFVxVtnoc\n\nNotiere die **5 Belege** für Evolution, die Darwin fand.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Simulation: Natürliche Selektion", "icon": "cpu", "color": "#2E7D32",
                  "description": "Experimentiere mit PhET Natural Selection:\n\n🔗 https://phet.colorado.edu/de/simulations/natural-selection\n\nBeobachte: Welche Hasen überleben bei verschiedenen Umweltbedingungen? Warum?\n\n*Interdisziplinär: Verbindung zu Mathe (Wahrscheinlichkeit) und Geographie (Lebensräume).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Fossilien als Zeitzeugen", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere berühmte Fossilienfunde:\n- Archaeopteryx\n- Lucy (Australopithecus)\n- Tiktaalik\n\n🔗 https://www.planet-wissen.de/natur/forschung/fossilien/\n\nErstelle einen **Zeitstrahl** mit den wichtigsten Entwicklungsstufen.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Analogie und Homologie", "icon": "file-text", "color": "#4527A0",
                  "description": "Erkläre den Unterschied zwischen **homologen** und **analogen** Organen.\n\nOrdne zu:\n- Arm Mensch / Flosse Wal / Flügel Vogel → ?\n- Flügel Vogel / Flügel Insekt → ?\n- Maulwurfspfote / Menschenhand → ?\n\nWas sagt das über **Verwandtschaft** aus?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Fantasie-Tier: Anpassung entwerfen", "icon": "edit-3", "color": "#C62828",
                  "description": "Entwirf ein **Fantasie-Tier**, das an einen extremen Lebensraum angepasst ist (z.B. Tiefsee, Wüste, Arktis).\n\nZeichne es und beschreibe:\n- Welche **Anpassungen** hat es?\n- Warum sind diese **vorteilhaft**?\n- Was frisst es und wer frisst es?\n\nPräsentiere dein Tier der Klasse.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]}
        ]
    },
    {
        "name": "Geschichte",
        "color": "#6D4C41",
        "ref": "06",
        "note": "Neuzeit, Industrialisierung, 20. Jahrhundert",
        "topics": [
            {"name": "Industrielle Revolution", "ref": "06.01",
             "description": "## Lernziele\n\n- Du kennst **Ursachen** und **Folgen** der Industrialisierung.\n- Du beschreibst die **Lebensbedingungen** der Arbeiter.\n- Du erklärst die Entstehung der **Arbeiterbewegung**.\n- Du vergleichst mit heutigen **Arbeitsbedingungen**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Industrielle Revolution", "icon": "play-circle", "color": "#1565C0",
                  "description": "Sieh dir den Film zur Industrialisierung an.\n\n🔗 https://www.youtube.com/watch?v=zhL5DCizj5c (Terra X)\n\nNotiere die **3 wichtigsten Erfindungen** und ihre Auswirkungen.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Quellenarbeit: Kinderarbeit im 19. Jh.", "icon": "globe", "color": "#00838F",
                  "description": "Lies historische Quellen zur Kinderarbeit:\n\n🔗 https://www.dhm.de/lemo/\n🔗 https://segu-geschichte.de/industrialisierung/\n\nBeantworte: Wie alt waren die Kinder? Wie lange arbeiteten sie? Wann wurde Kinderarbeit verboten?\n\n*Interdisziplinär: Verbindung zu Deutsch (Quellenanalyse) und Geographie (Urbanisierung).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Vergleich: Damals und Heute", "icon": "file-text", "color": "#4527A0",
                  "description": "Erstelle eine **Vergleichstabelle**:\n\n| Aspekt | 19. Jahrhundert | Heute |\n|--------|----------------|-------|\n| Arbeitszeit | | |\n| Kinderarbeit | | |\n| Sozialversicherung | | |\n| Gewerkschaften | | |\n| Arbeitssicherheit | | |",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Tagebucheintrag: Fabrikarbeiter", "icon": "edit-3", "color": "#C62828",
                  "description": "Verfasse einen **fiktiven Tagebucheintrag** (200 Wörter) aus der Sicht eines 12-jährigen Fabrikarbeiters um 1850. Beschreibe:\n- Tagesablauf\n- Arbeitsbedingungen\n- Gefühle und Wünsche\n\n*Interdisziplinär: Verbindung zu Deutsch (kreatives Schreiben).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Quiz: Industrialisierung", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen:\n\n🔗 https://segu-geschichte.de/industrialisierung/\n🔗 https://www.schlaukopf.de/\n\nNotiere Themen, bei denen du unsicher bist und wiederhole sie.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Weimarer Republik", "ref": "06.02",
             "description": "## Lernziele\n\n- Du kennst die **Gründung** und das **Scheitern** der Weimarer Republik.\n- Du erklärst die **politischen Krisen** (Inflation, Putschversuche).\n- Du verstehst die **Goldenen Zwanziger**.\n- Du analysierst **Ursachen** für den Aufstieg des Nationalsozialismus.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Weimarer Republik", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verschaffe dir einen Überblick über die Weimarer Republik.\n\n🔗 https://www.youtube.com/watch?v=3V9HjBLK_YA (MrWissen2go Geschichte)\n\nErstelle einen **Zeitstrahl** 1918-1933 mit den wichtigsten Ereignissen.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Quellenarbeit: Wahlplakate analysieren", "icon": "globe", "color": "#00838F",
                  "description": "Analysiere historische **Wahlplakate** der Weimarer Zeit:\n\n🔗 https://www.dhm.de/lemo/kapitel/weimarer-republik\n🔗 https://segu-geschichte.de/weimarer-republik/\n\nWähle 2 Plakate verschiedener Parteien und analysiere: Botschaft, Zielgruppe, Bildsprache.",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "digital", "title": "Hyperinflation 1923 berechnen", "icon": "monitor", "color": "#4527A0",
                  "description": "Die Inflation 1923 in Zahlen:\n- Januar 1923: 1 Brot = 250 Mark\n- Juli 1923: 1 Brot = 3.465 Mark\n- November 1923: 1 Brot = 201.000.000.000 Mark\n\nBerechne die **prozentuale Steigerung** pro Monat. Erstelle ein **Diagramm**.\n\n*Interdisziplinär: Verbindung zu Mathe (Prozentrechnung, exponentielles Wachstum).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Ursachen des Scheiterns", "icon": "file-text", "color": "#4527A0",
                  "description": "Benenne mindestens **5 Ursachen** für das Scheitern der Weimarer Republik und ordne sie:\n- Politische Ursachen\n- Wirtschaftliche Ursachen\n- Gesellschaftliche Ursachen\n\nWelche Ursache war deiner Meinung nach die **wichtigste**? Begründe!",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Diskussion: Demokratie schützen", "icon": "edit-3", "color": "#C62828",
                  "description": "Diskutiert in der Gruppe:\n\n> *Was können wir aus dem Scheitern der Weimarer Republik für heute lernen?*\n\nJeder notiert **3 Lehren** und präsentiert sie. Erstellt gemeinsam ein **Ergebnis-Poster**.\n\n*Interdisziplinär: Verbindung zu Politik (Demokratie heute).*",
                  "socialForm": "Gruppenarbeit", "submissionForm": "mündlich", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Nationalsozialismus und Holocaust", "ref": "06.03",
             "description": "## Lernziele\n\n- Du kennst die **Machtergreifung** und **Gleichschaltung**.\n- Du erklärst die **Verfolgung und Ermordung** der Juden.\n- Du arbeitest mit **Zeitzeugenberichten**.\n- Du reflektierst über **Erinnerungskultur** heute.",
             "tasks": [
                 {"type": "video", "title": "Dokumentation: Machtergreifung 1933", "icon": "play-circle", "color": "#1565C0",
                  "description": "Sieh dir die Dokumentation an:\n\n🔗 https://www.youtube.com/watch?v=ATEkS14CxDk (Terra X)\n\nNotiere: Wie gelang es Hitler, die Demokratie so schnell zu beseitigen?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Zeitzeugenberichte lesen", "icon": "globe", "color": "#00838F",
                  "description": "Lies einen **Zeitzeugenbericht** eines Holocaust-Überlebenden:\n\n🔗 https://www.zeitzeugen-portal.de/\n🔗 https://www.yadvashem.org/de.html\n\nSchreibe eine persönliche **Reflexion** (150 Wörter): Was hat dich am meisten berührt?",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Stufen der Verfolgung", "icon": "file-text", "color": "#4527A0",
                  "description": "Ordne die Ereignisse chronologisch und erkläre jede Stufe:\n- Boykott jüdischer Geschäfte (1933)\n- Nürnberger Gesetze (1935)\n- Novemberpogrome (1938)\n- Ghettoisierung\n- Wannsee-Konferenz (1942)\n- Vernichtungslager",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Stolpersteine recherchieren", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere, ob es in deiner Stadt **Stolpersteine** gibt:\n\n🔗 https://www.stolpersteine.eu/\n\nWähle einen Stolperstein aus und recherchiere die **Lebensgeschichte** dieser Person. Erstelle einen **Steckbrief**.\n\n*Interdisziplinär: Verbindung zu Geographie (Stadtgeschichte) und Deutsch (Recherche).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Gedenkprojekt gestalten", "icon": "edit-3", "color": "#C62828",
                  "description": "Gestaltet in der Gruppe ein **kleines Gedenkprojekt** für eure Schule:\n- Poster mit Zeitleiste und Zitaten\n- Oder: kurze Präsentation für eine andere Klasse\n- Oder: digitale Ausstellung (Padlet/Slides)\n\nWählt einen Ansatz und setzt ihn um.",
                  "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "45 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Kalter Krieg und deutsche Teilung", "ref": "06.04",
             "description": "## Lernziele\n\n- Du erklärst die Entstehung des **Kalten Krieges**.\n- Du vergleichst **BRD** und **DDR**.\n- Du analysierst den **Mauerbau** und den **Mauerfall**.\n- Du interviewst **Zeitzeugen** aus deinem Umfeld.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Kalter Krieg", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verschaffe dir einen Überblick über den Kalten Krieg.\n\n🔗 https://www.youtube.com/watch?v=wVPyUVJyB3w (MrWissen2go)\n\nErstelle eine **Übersicht**: West (USA/NATO) vs. Ost (UdSSR/Warschauer Pakt).",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Vergleich: BRD und DDR", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere den Alltag in BRD und DDR:\n\n🔗 https://www.hdg.de/lemo/kapitel/geteiltes-deutschland\n🔗 https://www.bpb.de/themen/deutsche-teilung/\n\nVergleiche: Schulsystem, Freizeit, Reisefreiheit, Wirtschaft.\n\n*Interdisziplinär: Verbindung zu Geographie (Grenzverlauf) und Politik (Systeme).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Zeitzeugenbefragung", "icon": "edit-3", "color": "#C62828",
                  "description": "Befrage eine Person aus deiner Familie oder Umgebung, die die **deutsche Teilung** oder die **Wende** erlebt hat.\n\nFragen:\n- Wie war der Alltag?\n- Wie hast du den 9. November 1989 erlebt?\n- Was hat sich nach der Wende verändert?\n\nSchreibe die Antworten auf und präsentiere sie.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "digital", "title": "Virtueller Mauergang", "icon": "monitor", "color": "#4527A0",
                  "description": "Erkunde die Berliner Mauer virtuell:\n\n🔗 https://www.chronik-der-mauer.de/\n🔗 https://www.berliner-mauer.de/\n\nWähle **3 Orte** an der ehemaligen Mauer und beschreibe, was dort geschah.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "selftest", "title": "Quiz: Deutsche Teilung", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen:\n\n🔗 https://segu-geschichte.de/kalter-krieg/\n🔗 https://www.schlaukopf.de/\n\nWiederhole Themen, bei denen du unsicher bist.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
             ]}
        ]
    },
    {
        "name": "Geographie",
        "color": "#00695C",
        "ref": "07",
        "note": "Erde, Klima, Wirtschaft, Nachhaltigkeit",
        "topics": [
            {"name": "Klimazonen der Erde", "ref": "07.01",
             "description": "## Lernziele\n\n- Du kennst die **Klimazonen** und ihre Merkmale.\n- Du liest **Klimadiagramme**.\n- Du erklärst den Zusammenhang von **Klima und Vegetation**.\n- Du verstehst die **Auswirkungen des Klimawandels** auf verschiedene Zonen.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Klimazonen", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne die 5 Klimazonen kennen.\n\n🔗 https://www.youtube.com/watch?v=Yb_3ck5n0hI\n\nZeichne eine **Weltkarte** und trage die Klimazonen farbig ein.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Klimadiagramme auswerten", "icon": "cpu", "color": "#2E7D32",
                  "description": "Übe das Lesen von Klimadiagrammen:\n\n🔗 https://www.diercke.de/content/klimadiagramme-lesen-und-auswerten\n🔗 https://learningapps.org/\n\nOrdne **5 Klimadiagramme** den richtigen Städten/Zonen zu.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Klimawandel-Folgen", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere die Auswirkungen des Klimawandels auf **eine Klimazone**:\n\n🔗 https://www.umweltbundesamt.de/themen/klima-energie/klimawandel\n🔗 https://www.wwf.de/themen-projekte/klima-energie/\n\n*Interdisziplinär: Verbindung zu Physik (Treibhauseffekt) und Biologie (Ökosysteme).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Klimadiagramm zeichnen", "icon": "file-text", "color": "#4527A0",
                  "description": "Zeichne ein **Klimadiagramm** für deinen Wohnort mit den Daten:\n\n🔗 https://de.climate-data.org/\n\nBestimme: Klimazone, Vegetationszone, Jahresdurchschnittstemperatur, Niederschlagssumme.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Reiseführer: Meine Klimazone", "icon": "edit-3", "color": "#C62828",
                  "description": "Erstelle einen **Mini-Reiseführer** (1 Seite) für eine Klimazone deiner Wahl:\n- Typisches **Wetter** zu verschiedenen Jahreszeiten\n- Typische **Pflanzen und Tiere**\n- **Gefahren** des Klimawandels für diese Zone\n- **Reisetipps**",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Globalisierung und Welthandel", "ref": "07.02",
             "description": "## Lernziele\n\n- Du erklärst den Begriff **Globalisierung**.\n- Du verfolgst **Produktionsketten** (z.B. Smartphone).\n- Du kennst **Fairen Handel** und seine Prinzipien.\n- Du diskutierst **Chancen und Risiken** der Globalisierung.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Globalisierung", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe die Grundlagen der Globalisierung.\n\n🔗 https://www.youtube.com/watch?v=JJ0nFD19eT8 (explainity)\n\nNotiere: Was sind die **Treiber** der Globalisierung?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Woher kommt mein Smartphone?", "icon": "globe", "color": "#00838F",
                  "description": "Verfolge die **Produktionskette** eines Smartphones:\n\n🔗 https://www.planet-wissen.de/technik/computer_und_roboter/smartphones/\n🔗 https://www.handyaktion.de/\n\nWo werden die Rohstoffe abgebaut? Unter welchen Bedingungen?\n\n*Interdisziplinär: Verbindung zu Chemie (Rohstoffe) und Politik (Menschenrechte).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Pro & Contra Globalisierung", "icon": "file-text", "color": "#4527A0",
                  "description": "Erstelle eine **Tabelle** mit je 5 Argumenten:\n\n| Pro | Contra |\n|-----|--------|\n| Zugang zu Produkten weltweit | Ausbeutung in Entwicklungsländern |\n| ... | ... |\n\nWelches Argument findest du am **stärksten**? Begründe!",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "digital", "title": "Fair-Trade-Produkte finden", "icon": "monitor", "color": "#4527A0",
                  "description": "Besuche einen Supermarkt (real oder online) und finde **5 Fair-Trade-Produkte**.\n\n- Was kostet das Fair-Trade-Produkt vs. das konventionelle?\n- Was bedeutet das **Siegel** konkret?\n\n🔗 https://www.fairtrade-deutschland.de/\n\nDokumentiere mit Fotos und Preisen.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Plakat: Fairer Handel", "icon": "edit-3", "color": "#C62828",
                  "description": "Gestaltet ein **Infoplakat** für die Schule zum Thema Fairer Handel.\n\nInhalt:\n- Was ist Fair Trade?\n- Welche Siegel gibt es?\n- Wie kann jeder Einzelne beitragen?\n\n*Interdisziplinär: Verbindung zu Deutsch (Informationstext) und Kunst (Gestaltung).*",
                  "socialForm": "Gruppenarbeit", "submissionForm": "mündlich", "effort": "40 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Naturgefahren und Katastrophenschutz", "ref": "07.03",
             "description": "## Lernziele\n\n- Du kennst **Erdbeben**, **Vulkanismus** und **Hochwasser**.\n- Du erklärst die **Plattentektonik**.\n- Du bewertest **Schutzmaßnahmen**.\n- Du erstellst einen **Notfallplan** für deine Region.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Plattentektonik", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe, warum die Erde bebt und Vulkane ausbrechen.\n\n🔗 https://www.youtube.com/watch?v=ryrXAGY1dmE\n\nZeichne die **tektonischen Platten** und markiere den Pazifischen Feuerring.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Simulation: Erdbeben", "icon": "cpu", "color": "#2E7D32",
                  "description": "Erkunde Erdbeben interaktiv:\n\n🔗 https://earthquake.usgs.gov/earthquakes/map/\n\nWo gab es in den letzten 7 Tagen Erdbeben? Markiere sie auf einer Karte. Was fällt auf?\n\n*Interdisziplinär: Verbindung zu Physik (Wellen, Energie).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Hochwasser in Deutschland", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere zum Hochwasser in Deutschland (z.B. Ahrtal 2021):\n\n🔗 https://www.umweltbundesamt.de/themen/wasser/hochwasser\n🔗 https://www.dwd.de/\n\nWelche **Ursachen** hatte das Hochwasser? Welche **Schutzmaßnahmen** gibt es?",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Katastrophenschutz planen", "icon": "file-text", "color": "#4527A0",
                  "description": "Erstelle einen **Notfallplan** für deine Familie:\n- Welche Naturgefahren gibt es in deiner Region?\n- Notfall-Ausrüstung (BBK-Checkliste)\n- Sammelpunkte und Kommunikation\n\n🔗 https://www.bbk.bund.de/DE/Warnung-Vorsorge/Tipps-Notsituationen/\n\n*Interdisziplinär: Verbindung zu Politik (staatlicher Katastrophenschutz).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Reportage: Naturkatastrophe", "icon": "edit-3", "color": "#C62828",
                  "description": "Schreibe eine **Reportage** (300 Wörter) über eine historische Naturkatastrophe:\n- Vesuvausbruch 79 n.Chr.\n- Erdbeben San Francisco 1906\n- Tsunami 2004\n- Ahrtal 2021\n\nRecherchiere Fakten und schreibe lebendig!\n\n*Interdisziplinär: Verbindung zu Deutsch (journalistisches Schreiben) und Geschichte.*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "35 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Stadt und Urbanisierung", "ref": "07.04",
             "description": "## Lernziele\n\n- Du kennst die **Merkmale** von Städten.\n- Du erklärst **Push- und Pull-Faktoren** der Urbanisierung.\n- Du analysierst **Stadtmodelle**.\n- Du entwickelst Ideen für eine **nachhaltige Stadt**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Urbanisierung", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe den globalen Trend zur Verstädterung.\n\n🔗 https://www.youtube.com/watch?v=sXWyCpiq0EQ\n\nNotiere: Wie viel Prozent der Menschen leben 2050 voraussichtlich in Städten?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Deine Stadt analysieren", "icon": "globe", "color": "#00838F",
                  "description": "Analysiere deine Stadt/Gemeinde:\n\n🔗 https://www.statistik-bw.de/ (oder Landesamt deines Bundeslandes)\n🔗 https://www.google.com/maps\n\n- Wie hat sich die **Einwohnerzahl** entwickelt?\n- Wo ist das **Zentrum**? Wo sind **Neubaugebiete**?\n- Gibt es **Pendlerströme**?",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Push- und Pull-Faktoren", "icon": "file-text", "color": "#4527A0",
                  "description": "Ordne die Faktoren in eine Tabelle:\n\n| Push (Land → Stadt) | Pull (Stadt lockt) |\n|---------------------|--------------------|\n| wenig Arbeitsplätze | bessere Jobs |\n| ... | ... |\n\nBenenne je **5 Faktoren** und finde für jeden ein **Beispiel** aus einem Entwicklungsland.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Stadt der Zukunft entwerfen", "icon": "edit-3", "color": "#C62828",
                  "description": "Entwirf eine **nachhaltige Stadt der Zukunft**:\n- Verkehrskonzept (ohne Autos?)\n- Energieversorgung (100% erneuerbar)\n- Grünflächen und Landwirtschaft\n- Wohnkonzepte\n\nZeichne einen **Stadtplan** und beschreibe dein Konzept.\n\n*Interdisziplinär: Verbindung zu Physik (Energie), Biologie (Stadtökologie).*",
                  "socialForm": "Gruppenarbeit", "submissionForm": "digital", "effort": "40 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Quiz: Stadt und Urbanisierung", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen:\n\n🔗 https://www.schlaukopf.de/\n🔗 https://learningapps.org/\n\nBearbeite mindestens **10 Aufgaben** zum Thema Urbanisierung.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
             ]}
        ]
    },
    {
        "name": "Chemie",
        "color": "#7B1FA2",
        "ref": "08",
        "note": "Stoffe, Reaktionen, Periodensystem",
        "topics": [
            {"name": "Atombau und Periodensystem", "ref": "08.01",
             "description": "## Lernziele\n\n- Du kennst den **Aufbau** eines Atoms (Protonen, Neutronen, Elektronen).\n- Du liest das **Periodensystem** (PSE).\n- Du bestimmst **Elektronenkonfigurationen**.\n- Du erklärst den Zusammenhang von **Stellung im PSE** und **Eigenschaften**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Atombau", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne den Aufbau des Atoms kennen.\n\n🔗 https://www.youtube.com/watch?v=NsKVvKjPJNQ (TheSimpleChemics)\n\nZeichne das **Schalenmodell** für die Atome: Wasserstoff, Kohlenstoff, Natrium, Chlor.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Interaktives PSE erkunden", "icon": "cpu", "color": "#2E7D32",
                  "description": "Erkunde das Periodensystem interaktiv:\n\n🔗 https://ptable.com/?lang=de\n\nSuche die Elemente: Na, Cl, Fe, O, C. Notiere für jedes: Ordnungszahl, Masse, Gruppe, Periode.\n\n*Interdisziplinär: Verbindung zu Physik (Kernphysik, Radioaktivität).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Elektronenkonfigurationen", "icon": "file-text", "color": "#4527A0",
                  "description": "Bestimme die Elektronenkonfiguration (Schalenmodell) für:\n1. Helium (He)\n2. Sauerstoff (O)\n3. Aluminium (Al)\n4. Kalium (K)\n5. Schwefel (S)\n\nWelche Elemente haben eine **volle Außenschale**? Was bedeutet das?",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Elementen-Steckbrief", "icon": "globe", "color": "#00838F",
                  "description": "Wähle **ein Element** und erstelle einen Steckbrief:\n- Entdeckung und Name\n- Eigenschaften (Farbe, Schmelzpunkt, etc.)\n- Vorkommen in der Natur\n- Verwendung im Alltag\n\n🔗 https://www.seilnacht.com/Lexikon/PSE.htm\n🔗 https://de.wikipedia.org/wiki/Periodensystem",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Quiz: PSE und Atombau", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen zum Periodensystem:\n\n🔗 https://www.schlaukopf.de/\n🔗 https://learningapps.org/\n\nKannst du die ersten **20 Elemente** auswendig benennen?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Chemische Reaktionen", "ref": "08.02",
             "description": "## Lernziele\n\n- Du erkennst **chemische Reaktionen** im Alltag.\n- Du stellst **Reaktionsgleichungen** auf und **gleichst sie aus**.\n- Du unterscheidest **exotherme** und **endotherme** Reaktionen.\n- Du erklärst den **Massenerhaltungssatz**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Chemische Reaktionen", "icon": "play-circle", "color": "#1565C0",
                  "description": "Lerne den Unterschied zwischen physikalischen und chemischen Vorgängen.\n\n🔗 https://www.youtube.com/watch?v=TStPl0IAPXE\n\nNenne **5 chemische Reaktionen** aus dem Alltag (z.B. Rosten, Backen, Verbrennen).",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Reaktionsgleichungen ausgleichen", "icon": "cpu", "color": "#2E7D32",
                  "description": "Übe das Ausgleichen von Reaktionsgleichungen:\n\n🔗 https://phet.colorado.edu/de/simulations/balancing-chemical-equations\n\nGleiche mindestens **8 Gleichungen** erfolgreich aus.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Experiment: Chemie in der Küche", "icon": "edit-3", "color": "#C62828",
                  "description": "Führe **2 ungefährliche Experimente** zu Hause durch:\n1. Backpulver + Essig → Was passiert? Welches Gas entsteht?\n2. Rotkohlsaft als **pH-Indikator** — teste verschiedene Flüssigkeiten\n\nDokumentiere mit Fotos und erkläre die chemischen Reaktionen.\n\n*Interdisziplinär: Verbindung zu Biologie (Säuren und Basen im Körper).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "30 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Reaktionsgleichungen aufstellen", "icon": "file-text", "color": "#4527A0",
                  "description": "Stelle die Reaktionsgleichung auf und gleiche aus:\n1. Eisen + Sauerstoff → Eisenoxid\n2. Magnesium + Salzsäure → Magnesiumchlorid + Wasserstoff\n3. Methan + Sauerstoff → Kohlenstoffdioxid + Wasser\n4. Natrium + Wasser → Natriumhydroxid + Wasserstoff",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Exotherme Reaktionen im Alltag", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere **3 exotherme** und **2 endotherme** Reaktionen aus dem Alltag:\n\n🔗 https://www.chemie.de/lexikon/\n🔗 https://www.seilnacht.com/\n\nErkläre jeweils: Was reagiert? Wird Energie frei oder aufgenommen?\n\n*Interdisziplinär: Verbindung zu Physik (Energie, Wärme).*",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]},
            {"name": "Säuren, Basen und Salze", "ref": "08.03",
             "description": "## Lernziele\n\n- Du kennst **Säuren** und **Basen** und den **pH-Wert**.\n- Du führst **Neutralisationsreaktionen** durch.\n- Du erklärst die Bedeutung des pH-Werts im **Alltag**.\n- Du arbeitest sicher mit **Indikatoren**.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: pH-Wert und Indikatoren", "icon": "play-circle", "color": "#1565C0",
                  "description": "Verstehe die pH-Skala und wie Indikatoren funktionieren.\n\n🔗 https://www.youtube.com/watch?v=plnSzFC-JkY\n\nZeichne die **pH-Skala** von 0-14 und ordne zu: Zitrone, Wasser, Seife, Salzsäure, Natronlauge.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "creative", "title": "Experiment: pH-Wert messen", "icon": "edit-3", "color": "#C62828",
                  "description": "Miss den **pH-Wert** von mindestens 8 Haushaltsflüssigkeiten:\n- Zitronensaft, Essig, Cola\n- Leitungswasser, Milch\n- Seifenlösung, Backpulverlösung\n\nNutze **Rotkohlsaft** als Indikator oder **pH-Teststreifen**.\n\nErstelle eine **sortierte Liste** von sauer → basisch.",
                  "socialForm": "Einzelarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "worksheet", "title": "Neutralisation", "icon": "file-text", "color": "#4527A0",
                  "description": "Erkläre die **Neutralisationsreaktion**:\n\nSäure + Base → Salz + Wasser\n\nStelle die Gleichungen auf:\n1. HCl + NaOH → ?\n2. H₂SO₄ + 2 KOH → ?\n3. HNO₃ + NaOH → ?\n\nBenenne jeweils das entstehende **Salz**.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "20 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Saurer Regen", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere die Entstehung und Folgen von **saurem Regen**:\n\n🔗 https://www.umweltbundesamt.de/\n🔗 https://www.planet-wissen.de/\n\nWelche Chemikalien sind verantwortlich? Welche Gegenmaßnahmen gibt es?\n\n*Interdisziplinär: Verbindung zu Geographie (Umweltschutz) und Biologie (Waldsterben).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "20 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "selftest", "title": "Quiz: Säuren und Basen", "icon": "check-square", "color": "#2E7D32",
                  "description": "Teste dein Wissen:\n\n🔗 https://www.schlaukopf.de/\n🔗 https://learningapps.org/\n\nZiel: **80% richtig**. Wiederhole schwache Bereiche.",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "10 Minuten", "correctionForm": "Selbstkorrektur"}
             ]},
            {"name": "Organische Chemie: Kohlenstoff", "ref": "08.04",
             "description": "## Lernziele\n\n- Du kennst die **Besonderheiten** des Kohlenstoff-Atoms.\n- Du benennst **Alkane** (Methan bis Dekan).\n- Du erklärst **Isomerie**.\n- Du verstehst die Bedeutung von **Erdöl** als Rohstoff.",
             "tasks": [
                 {"type": "video", "title": "Erklärvideo: Organische Chemie", "icon": "play-circle", "color": "#1565C0",
                  "description": "Warum ist Kohlenstoff so besonders?\n\n🔗 https://www.youtube.com/watch?v=8cRTz-vn1X4 (TheSimpleChemics)\n\nErkläre: Warum kann Kohlenstoff so viele verschiedene Verbindungen bilden?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "12 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "learningapp", "title": "Moleküle bauen", "icon": "cpu", "color": "#2E7D32",
                  "description": "Baue 3D-Moleküle mit einem Online-Tool:\n\n🔗 https://molview.org/\n\nBaue: Methan (CH₄), Ethan (C₂H₆), Propan (C₃H₈), Butan (C₄H₁₀).\n\nWelches Muster erkennst du bei der **Summenformel** CₙH₂ₙ₊₂?",
                  "socialForm": "Einzelarbeit", "submissionForm": "keine", "effort": "15 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "worksheet", "title": "Alkane benennen", "icon": "file-text", "color": "#4527A0",
                  "description": "Fülle die Tabelle aus:\n\n| Name | Formel | Aggregatzustand | Verwendung |\n|------|--------|----------------|------------|\n| Methan | CH₄ | gasförmig | Erdgas, Heizung |\n| Ethan | | | |\n| ... bis Dekan | | | |\n\nZeichne die **Strukturformeln** für Methan bis Butan.",
                  "socialForm": "Einzelarbeit", "submissionForm": "Heft", "effort": "25 Minuten", "correctionForm": "Selbstkorrektur"},
                 {"type": "weblink", "title": "Recherche: Erdöl — vom Rohstoff zum Produkt", "icon": "globe", "color": "#00838F",
                  "description": "Recherchiere den Weg des Erdöls:\n\n🔗 https://www.planet-wissen.de/technik/energie/erdoel/\n\n- Wie entsteht Erdöl?\n- Was passiert in einer **Raffinerie** (fraktionierte Destillation)?\n- Welche **Produkte** entstehen?\n\n*Interdisziplinär: Verbindung zu Geographie (Lagerstätten) und Physik (Energie).*",
                  "socialForm": "Partnerarbeit", "submissionForm": "digital", "effort": "25 Minuten", "correctionForm": "Lehrerkorrektur"},
                 {"type": "creative", "title": "Plakat: Alternativen zu Erdöl", "icon": "edit-3", "color": "#C62828",
                  "description": "Erstellt ein **Plakat** zu Alternativen für Erdölprodukte:\n- Bioplastik statt Plastik\n- Elektroauto statt Benzin\n- Nachwachsende Rohstoffe\n\nFür jede Alternative: Was ist der Vorteil? Was der Nachteil?\n\n*Interdisziplinär: Verbindung zu Physik (Energie), Geographie (Nachhaltigkeit), Politik.*",
                  "socialForm": "Gruppenarbeit", "submissionForm": "mündlich", "effort": "35 Minuten", "correctionForm": "Lehrerkorrektur"}
             ]}
        ]
    }
]

def write_content():
    base = pathlib.Path(__file__).parent

    for subj in SUBJECTS:
        subj_dir = base / subj["name"]
        subj_dir.mkdir(parents=True, exist_ok=True)

        # Subject metadata file
        with open(subj_dir / "metadata.json", "w") as f:
            json.dump({
                "name": subj["name"],
                "ref": subj["ref"],
                "color": subj["color"],
                "note": subj["note"]
            }, f, indent=2, ensure_ascii=False)

        for topic in subj["topics"]:
            topic_dir = subj_dir / topic["name"]
            topic_dir.mkdir(parents=True, exist_ok=True)

            # seite.md
            with open(topic_dir / "seite.md", "w") as f:
                f.write(f"---\ntitle: {topic['name']}\n---\n\n{topic['description']}\n")

            # .task files
            for i, task in enumerate(topic["tasks"], 1):
                safe_title = task["title"][:30].replace(" ", "_").replace("/", "-")
                safe_title = "".join(c for c in safe_title if c.isalnum() or c in "_-äöüÄÖÜß")
                fname = f"{i:02d}_{safe_title}.task"

                task_data = {
                    "version": 1,
                    "type": task["type"],
                    "title": task["title"],
                    "description": task["description"],
                    "icon": task["icon"],
                    "color": task["color"],
                    "badgeIcon": None,
                    "level": None,
                    "attachments": [],
                    "socialForm": task["socialForm"],
                    "submissionForm": task["submissionForm"],
                    "effort": task["effort"],
                    "correctionForm": task["correctionForm"],
                    "solution": ""
                }

                with open(topic_dir / fname, "w") as f:
                    json.dump(task_data, f, indent=2, ensure_ascii=False)

    print(f"Generated content for {len(SUBJECTS)} subjects")
    total_topics = sum(len(s["topics"]) for s in SUBJECTS)
    total_tasks = sum(len(t["tasks"]) for s in SUBJECTS for t in s["topics"])
    print(f"  {total_topics} topics, {total_tasks} tasks")

if __name__ == "__main__":
    write_content()
