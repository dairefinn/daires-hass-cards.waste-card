# Waste card

A waste collection card for Home Assistant. Shows upcoming bin collection dates for multiple bins, highlights the next bin due in its own colour, and displays a countdown label (Today / Tomorrow / N days).

<img width="100%" alt="image" src="https://github.com/user-attachments/assets/97667d8b-a035-47e2-84f9-e53ae294632c" />

## Installation

### HACS (recommended)

1. In Home Assistant, go to **HACS → Frontend → ⋮ → Custom repositories**
2. Add this repository URL and set the category to **Lovelace**
3. Click **Download** on the waste-card entry
4. Restart Home Assistant

### Manual

1. Copy `waste-card.js` to your Home Assistant `config/www/` folder.
2. Add the resource in your Lovelace dashboard:
   - **Settings → Dashboards → Resources → Add Resource**
   - URL: `/local/waste-card.js`
   - Type: `JavaScript module`

## Sensor format

The card reads collection dates from entity state attributes. Each attribute key must be an ISO date (`YYYY-MM-DD`); the card picks the earliest date that is today or in the future.

This format is produced out of the box by the [Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule) integration.

## Configuration

`bins` is required and must contain at least one entry.

| Option | Type | Default | Description |
|---|---|---|---|
| `bins` | list | — | List of bin objects (see below) |
| `title` | string | — | Card title shown above the bins |

### `bins` items

| Field | Type | Default | Description |
|---|---|---|---|
| `entity` | string | — | Sensor entity ID that holds collection date attributes |
| `name` | string | `"Bin"` | Display name shown below the icon |
| `color` | string | `var(--primary-color)` | Accent colour for the icon and countdown when this bin is next |
| `icon` | string | `"mdi:trash-can"` | MDI icon name |

## Examples

**Three bins:**
```yaml
type: custom:daires-hass-cards-waste-card
title: Waste Collection
bins:
  - entity: sensor.waste_collection_schedule_brown_bin
    name: Brown
    color: "#795548"
    icon: mdi:leaf
  - entity: sensor.waste_collection_schedule_black_bin
    name: Black
    color: "#616161"
    icon: mdi:trash-can
  - entity: sensor.waste_collection_schedule_green_bin
    name: Green
    color: "#43a047"
    icon: mdi:recycle
```

**Single bin, no title:**
```yaml
type: custom:daires-hass-cards-waste-card
bins:
  - entity: sensor.waste_collection_schedule_green_bin
    name: Green Bin
    color: "#43a047"
    icon: mdi:recycle
```

## Demo

Open `demo.html` in a browser to preview the card without Home Assistant.
