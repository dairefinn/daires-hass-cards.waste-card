class WasteCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  setConfig(config) {
    if (!config.bins?.length) {
      throw new Error("'bins' array with at least one entry is required");
    }
    this._config = config;
    this._render();
  }

  getCardSize() {
    return 2;
  }

  static getStubConfig() {
    return {
      title: "Waste Collection",
      bins: [
        { entity: "sensor.waste_collection_schedule_brown_bin",  name: "Brown", color: "#795548", icon: "mdi:leaf" },
        { entity: "sensor.waste_collection_schedule_black_bin",  name: "Black", color: "#616161", icon: "mdi:trash-can" },
        { entity: "sensor.waste_collection_schedule_green_bin",  name: "Green", color: "#43a047", icon: "mdi:recycle" },
      ],
    };
  }

  _getNextDate(entityId) {
    const state = this._hass?.states[entityId];
    if (!state) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = Object.keys(state.attributes)
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .map(k => new Date(k + "T00:00:00"))
      .filter(d => d >= today)
      .sort((a, b) => a - b);
    return dates[0] ?? null;
  }

  _daysUntil(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.round((date - today) / 86400000);
  }

  _countdownLabel(days) {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  }

  _formatDate(date) {
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  }

  _render() {
    if (!this._config) return;
    const { bins: binConfigs, title } = this._config;

    const bins = binConfigs.map(bin => {
      const nextDate = this._getNextDate(bin.entity);
      const days = nextDate !== null ? this._daysUntil(nextDate) : null;
      return { ...bin, nextDate, days };
    });

    const validDays = bins.filter(b => b.days !== null).map(b => b.days);
    const minDays = validDays.length ? Math.min(...validDays) : null;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; height: 100%; }
        ha-card { height: 100%; }
        .card {
          background: var(--card-background-color, #ffffff);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
          height: 100%;
        }
        .title {
          font-size: 14px;
          font-weight: 500;
          color: var(--secondary-text-color, #727272);
        }
        .bins {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .bin {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-align: center;
          min-width: 0;
        }
        .icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          --mdc-icon-size: 24px;
        }
        .bin-name {
          font-size: 13px;
          font-weight: 400;
          color: var(--secondary-text-color, #727272);
        }
        .bin-countdown {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.1;
          word-break: break-word;
        }
        .bin-date {
          font-size: 13px;
          color: var(--secondary-text-color, #727272);
        }
      </style>
      <ha-card>
        <div class="card">
          ${title ? `<div class="title">${title}</div>` : ""}
          <div class="bins">
            ${bins.map(bin => {
              const isNext = minDays !== null && bin.days === minDays;
              const color = bin.color ?? "var(--primary-color, #03a9f4)";
              const countdown = bin.days !== null ? this._countdownLabel(bin.days) : "—";
              const dateStr = bin.nextDate ? this._formatDate(bin.nextDate) : "—";
              const countdownColor = isNext ? color : "var(--primary-text-color, #212121)";
              return `
                <div class="bin">
                  <div class="icon-wrap" style="background: color-mix(in srgb, ${color} 15%, transparent);">
                    <ha-icon icon="${bin.icon ?? "mdi:trash-can"}" style="color: ${color};"></ha-icon>
                  </div>
                  <div class="bin-name">${bin.name ?? "Bin"}</div>
                  <div class="bin-countdown" style="color: ${countdownColor};">${countdown}</div>
                  <div class="bin-date">${dateStr}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </ha-card>
    `;
  }
}

customElements.define("daires-hass-cards-waste-card", WasteCard);
