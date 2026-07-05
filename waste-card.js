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

  static getConfigElement() {
    return document.createElement("daires-hass-cards-waste-card-editor");
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

class WasteCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach(p => { p.hass = hass; });
  }

  setConfig(config) {
    this._config = { ...config, bins: (config.bins ?? []).map(b => ({ ...b })) };
    this._render();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: { ...this._config, bins: this._config.bins.map(b => ({ ...b })) } },
      bubbles: true,
      composed: true,
    }));
  }

  _setTop(key, value) {
    if (value === "" || value === undefined) {
      delete this._config[key];
    } else {
      this._config[key] = value;
    }
    this._fire();
  }

  _setBin(index, key, value) {
    const bin = { ...this._config.bins[index] };
    if (value === "" || value === undefined) {
      delete bin[key];
    } else {
      bin[key] = value;
    }
    this._config.bins = this._config.bins.map((b, i) => i === index ? bin : b);
    this._fire();
  }

  _addBin() {
    this._config.bins = [...this._config.bins, { entity: "", name: "Bin", color: "#607d8b", icon: "mdi:trash-can" }];
    this._fire();
  }

  _removeBin(index) {
    this._config.bins = this._config.bins.filter((_, i) => i !== index);
    this._fire();
  }

  _render() {
    const c = this._config ?? {};
    const bins = c.bins ?? [];

    this.shadowRoot.innerHTML = `
      <style>
        .form { display: flex; flex-direction: column; gap: 12px; padding: 16px 0; }
        .section { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--secondary-text-color, #727272); padding-bottom: 4px; border-bottom: 1px solid var(--divider-color, #e0e0e0); margin-top: 8px; }
        .row { display: flex; flex-direction: column; gap: 4px; }
        .row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
        label { font-size: 12px; color: var(--secondary-text-color, #727272); }
        input[type=text] { padding: 8px 10px; border: 1px solid var(--divider-color, #e0e0e0); border-radius: 6px; font-size: 14px; color: var(--primary-text-color, #212121); background: var(--card-background-color, #fff); box-sizing: border-box; width: 100%; }
        ha-entity-picker { display: block; }
        .bin-block { border: 1px solid var(--divider-color, #e0e0e0); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .bin-header { display: flex; justify-content: space-between; align-items: center; }
        .bin-label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color, #727272); }
        .btn-remove { background: none; border: none; cursor: pointer; color: var(--error-color, #db4437); font-size: 18px; line-height: 1; padding: 2px 6px; border-radius: 4px; }
        .btn-remove:hover { background: color-mix(in srgb, var(--error-color, #db4437) 10%, transparent); }
        .btn-add { margin-top: 4px; padding: 8px 14px; border: 1px dashed var(--primary-color, #03a9f4); border-radius: 8px; background: none; color: var(--primary-color, #03a9f4); font-size: 13px; cursor: pointer; width: 100%; }
        .btn-add:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent); }
      </style>
      <div class="form">
        <div class="section">General</div>
        <div class="row">
          <label>Title</label>
          <input id="title" type="text" placeholder="Waste Collection" value="${c.title ?? ""}" />
        </div>

        <div class="section">Bins</div>
        ${bins.map((bin, i) => `
          <div class="bin-block">
            <div class="bin-header">
              <span class="bin-label">Bin ${i + 1}</span>
              <button class="btn-remove" data-remove="${i}" title="Remove">✕</button>
            </div>
            <div class="row">
              <label>Entity</label>
              <ha-entity-picker allow-custom-entity></ha-entity-picker>
            </div>
            <div class="row-3">
              <div class="row"><label>Name</label><input class="bin-name" type="text" placeholder="Bin" value="${bin.name ?? ""}" /></div>
              <div class="row"><label>Color</label><input class="bin-color" type="text" placeholder="var(--primary-color)" value="${bin.color ?? ""}" /></div>
              <div class="row"><label>Icon</label><input class="bin-icon" type="text" placeholder="mdi:trash-can" value="${bin.icon ?? ""}" /></div>
            </div>
          </div>
        `).join("")}
        <button class="btn-add" id="add-bin">+ Add Bin</button>
      </div>
    `;

    this.shadowRoot.getElementById("title")
      .addEventListener("change", e => this._setTop("title", e.target.value));

    this.shadowRoot.getElementById("add-bin")
      .addEventListener("click", () => this._addBin());

    this.shadowRoot.querySelectorAll(".btn-remove").forEach(btn => {
      btn.addEventListener("click", e => this._removeBin(parseInt(e.currentTarget.dataset.remove, 10)));
    });

    this.shadowRoot.querySelectorAll("ha-entity-picker").forEach((picker, i) => {
      picker.value = bins[i]?.entity ?? "";
      if (this._hass) picker.hass = this._hass;
      picker.addEventListener("value-changed", e => this._setBin(i, "entity", e.detail.value));
    });

    this.shadowRoot.querySelectorAll(".bin-name").forEach((el, i) => {
      el.addEventListener("change", e => this._setBin(i, "name", e.target.value));
    });
    this.shadowRoot.querySelectorAll(".bin-color").forEach((el, i) => {
      el.addEventListener("change", e => this._setBin(i, "color", e.target.value));
    });
    this.shadowRoot.querySelectorAll(".bin-icon").forEach((el, i) => {
      el.addEventListener("change", e => this._setBin(i, "icon", e.target.value));
    });
  }
}

customElements.define("daires-hass-cards-waste-card-editor", WasteCardEditor);
