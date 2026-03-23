# ZorgAgent

**AI-assistent voor Nederlandse zorginstellingen via WhatsApp.**

ZorgAgent bespaart zorgteams 20+ uur per week op administratie. Volledig AVG-proof en EU AI Act compliant. Geen koppelingen met bestaande systemen. Geen IT-afdeling nodig.

## Wat het doet

```
Verzorgende spreekt 30 sec in via WhatsApp
    → AI genereert gestructureerde rapportage
        → Medewerker keurt goed met één tik
            → Familie ontvangt warm weekbericht
                → Instelling bouwt reputatie op
```

### Modules

| Module | Input | Output | Controle |
|--------|-------|--------|----------|
| **ZorgBericht** | Dagelijkse check-ins | Weekberichten naar familie | EVV'er keurt goed voor verzending |
| **ZorgStem** | 30 sec voicenote | Gestructureerde rapportage | Medewerker controleert en past aan |
| **ZorgMatch** | Open dienst | Flexpool automatisch benaderd | Roosteraar beslist wie werkt |
| **ZorgReputatie** | Tevreden families | Review-verzoek ZorgkaartNederland | Instelling bepaalt timing |

## Architectuur

```
┌──────────────────────────────────────────────────┐
│  WhatsApp (Baileys)                              │
│  Medewerkers sturen check-ins via spraak/tekst   │
└──────────────┬───────────────────────────────────┘
               │
┌──────────────▼───────────────────────────────────┐
│  ZorgAgent Core                                  │
│                                                  │
│  ┌─────────┐  ┌───────────┐  ┌────────────────┐ │
│  │Check-in │→ │ Scheduler │→ │ Skill Engine   │ │
│  │Ingestie │  │ (cron)    │  │                │ │
│  └─────────┘  └───────────┘  │ ┌────────────┐ │ │
│                              │ │ZorgBericht │ │ │
│  ┌──────────────────────┐    │ │ZorgStem    │ │ │
│  │ Onboarding           │    │ │ZorgMatch   │ │ │
│  │ (step-machine, PIN)  │    │ └────────────┘ │ │
│  └──────────────────────┘    └───────┬────────┘ │
│                                      │          │
│  ┌──────────────────────┐    ┌───────▼────────┐ │
│  │ Audit Logger         │    │ Approval Gate  │ │
│  │ (elke actie gelogd)  │    │ (mens beslist) │ │
│  └──────────────────────┘    └───────┬────────┘ │
└──────────────────────────────────────┼──────────┘
                                       │
┌──────────────────────────────────────▼──────────┐
│  Output Channels                                 │
│  Email (Resend) · WhatsApp · Dashboard           │
└──────────────────────────────────────────────────┘
```

### Ontwerpprincipes

- **Mens beslist, altijd.** Elke AI-output wordt goedgekeurd door een zorgprofessional voordat er iets mee gebeurt.
- **Filesystem als bron van waarheid.** Sessies, instellingsdata en goedkeuringen leven op disk.
- **Geen koppelingen.** ZorgAgent is ECD-onafhankelijk. Werkt naast Nedap Ons, Puur, Lable, Ecare.
- **Audit trail vanaf dag 1.** Elke actie, goedkeuring en wijziging wordt gelogd. AVG-inzageverzoek of IGJ-controle? Alles traceerbaar.

## EU AI Act Compliance

ZorgAgent is gebouwd volgens de vereisten van de EU AI Act (van kracht augustus 2027):

- **Menselijk toezicht** — ingebouwd in elke module via de Approval Gate
- **Data-isolatie** — elke instelling draait in een eigen geïsoleerde omgeving
- **Volledige logging** — audit-proof, exporteerbaar
- **Transparantie** — elke output vermeldt dat het door AI is gegenereerd
- **High-risk ready** — ZorgMatch (dienstplanning, Annex III) conformiteitsbeoordeling voorbereid

## Code Sample: Approval Gate

Het hart van het systeem — niets verlaat ZorgAgent zonder menselijke goedkeuring:

```typescript
export async function approveReport(
  instelling: Instelling,
  bewoner: Bewoner,
  report: GeneratedReport,
  approver: Medewerker
): Promise<ApprovalResult> {
  const message = formatApprovalRequest(report, bewoner);
  await channel.send(approver.phone, message);

  const response = await channel.waitForReply(approver.phone, {
    timeout: 48 * 60 * 60 * 1000,
    validResponses: ['ok', 'wijzig', 'afwijzen']
  });

  // Elke beslissing gelogd — audit trail
  await logger.log({
    type: 'approval_decision',
    instelling: instelling.id,
    bewoner: bewoner.id,
    approver: approver.id,
    decision: response.decision,
    timestamp: new Date().toISOString()
  });

  if (response.decision === 'ok') return { approved: true, report };
  if (response.decision === 'wijzig') return { approved: true, report: response.editedText };
  return { approved: false, reason: response.reason };
}
```

## Stack

| Component | Technologie |
|-----------|-------------|
| Runtime | Node.js + TypeScript |
| Messaging | WhatsApp via Baileys |
| AI | Anthropic Claude API |
| Spraak | Google Gemini (transcriptie) |
| Email | Resend |
| State | Filesystem (JSON + Markdown) |

## Status

ZorgAgent is in actieve ontwikkeling. De ZorgBericht module is operationeel.

## Contact

Gebouwd door **Y. Hajar** — AI consultancy voor Nederlandse zorginstellingen.

Interesse in een pilot? [yhajar@biedkracht.nl](mailto:yhajar@biedkracht.nl)
